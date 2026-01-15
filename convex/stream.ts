import { httpAction } from './_generated/server'
import { postRequestBodySchema } from './lib/schema'
import { StreamService, FREE_TIER_ALLOWED_MODEL } from './lib/stream_service'
import { AppError, ChatSDKError } from './lib/errors'
import type { UIMessage } from 'ai'
import { api } from './_generated/api'

const getCorsHeaders = (request: Request) => {
  const origin = request.headers.get('origin')
  const allowOrigin = origin ?? '*'
  const requestedHeaders =
    request.headers.get('access-control-request-headers') ??
    'Content-Type, Authorization'

  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': requestedHeaders,
    'Access-Control-Max-Age': '86400',
    // If the client code needs to read stream-related headers
    'Access-Control-Expose-Headers': 'Content-Type, X-Vercel-AI-Data-Stream',
  }

  // Only set credentials + Vary when we're reflecting a real Origin.
  if (origin) {
    headers['Access-Control-Allow-Credentials'] = 'true'
    headers['Vary'] = 'Origin'
  }

  return headers
}

const withCors = (request: Request, response: Response): Response => {
  const headers = new Headers(response.headers)
  Object.entries(getCorsHeaders(request)).forEach(([key, value]) => {
    headers.set(key, value)
  })

  // For streaming responses, we need to preserve the body stream
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  })
}

export const streamOptions = httpAction(async (_ctx, request) => {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  })
})

export const stream = httpAction(async (ctx, request) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(request),
    })
  }

  try {
    // Check authentication
    const userIdentity = await ctx.auth.getUserIdentity()
    if (!userIdentity) {
      return withCors(
        request,
        new AppError(
          'unauthorized',
          'auth',
          'Please login to continue',
        ).toResponse(),
      )
    }

    const service = new StreamService(ctx)

    // Ensure user exists in Convex for usage tracking
    await ctx.runMutation(api.users.ensure, {})

    // Request validation
    const body = await request.json()
    const res = postRequestBodySchema.safeParse(body)

    if (!res.success) {
      return withCors(
        request,
        new AppError('bad_request', 'api', res.error.message).toResponse(),
      )
    }

    const { threadId, userMessage, prevMessages, model } = res.data
    const modelId = model || FREE_TIER_ALLOWED_MODEL

    // Check if user has API keys
    const hasApiKeys = await service.checkUserHasApiKeys()

    // If user has no API keys, validate model restriction
    if (!hasApiKeys) {
      if (modelId !== FREE_TIER_ALLOWED_MODEL) {
        return withCors(
          request,
          new AppError(
            'bad_request',
            'chat',
            `Users without API keys can only use ${FREE_TIER_ALLOWED_MODEL}. Please add an API key to use other models.`,
          ).toResponse(),
        )
      }
    }

    // Select appropriate model
    const selectedModel = await service.selectModel(modelId, hasApiKeys)

    // Get or create thread
    const { id: providedThreadId, isNew } = await service.getOrCreateThread(
      threadId,
      modelId,
    )

    // Generate title and create thread if new
    if (isNew) {
      const userMessageContent = userMessage.parts
        .map((part) => {
          if (part.type === 'text') {
            return part.text
          }
          if (part.type === 'file') {
            return part.filename
          }
        })
        .join(' ')

      let title: string
      try {
        const titleModel = service.getFreeTierModel()
        title = await service.generateThreadTitle(
          titleModel,
          userMessageContent,
        )
      } catch (err: any) {
        title = userMessageContent
          ? userMessageContent.split(' ').slice(0, 4).join(' ') || 'New Chat'
          : 'New Chat'
        console.error('Title generation failed, using fallback:', err)
      }

      try {
        await service.createThread(providedThreadId, title, modelId)
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === 'Failed to create thread'
        ) {
          throw new ChatSDKError('bad_request', 'database')
        }
        throw error
      }
    }

    const previousMessage = [...prevMessages]
      .reverse()
      .find((message) => message.id !== userMessage.id)
    await service.saveUserMessage(
      providedThreadId,
      userMessage,
      previousMessage?.id,
      modelId,
    )

    if (!hasApiKeys) {
      try {
        await service.checkFreeMessageLimit()
      } catch (limitError) {
        if (
          limitError instanceof AppError &&
          limitError.type === 'rate_limit'
        ) {
          const errorText =
            'You have exceeded your maximum number of messages for the day. Please try again later.'
          await service.saveAssistantMessage(
            providedThreadId,
            [],
            userMessage.id,
            errorText,
            modelId,
          )
        }
        throw limitError
      }
    }

    const allMessages = [
      ...prevMessages.map((message) => ({
        id: message.id,
        role: message.role,
        parts: message.parts,
      })),
      {
        id: userMessage.id,
        role: userMessage.role,
        parts: userMessage.parts,
      },
    ] as Array<{
      id: string
      role: UIMessage['role']
      parts: UIMessage['parts']
    }>

    try {
      const streamResponse = await service.streamChatResponse(
        selectedModel,
        allMessages,
        providedThreadId,
        userMessage.id,
        modelId,
        request.signal,
      )

      if (!hasApiKeys) {
        await service.incrementFreeMessageCount()
      }

      return withCors(request, streamResponse)
    } catch (e) {
      let errorMessage = 'AI failed to generate response'

      if (e && typeof e === 'object' && 'error' in e) {
        try {
          const parsed = JSON.parse((e.error as any)?.responseBody ?? '{}')
          if (parsed?.error?.status === 'INVALID_ARGUMENT') {
            errorMessage = 'Invalid API key or configuration'
            await service.saveAssistantMessage(
              providedThreadId,
              [],
              userMessage.id,
              errorMessage,
              modelId,
            )
            return withCors(
              request,
              new ChatSDKError('bad_request', 'api_key').toResponse(),
            )
          }
          errorMessage = parsed?.error?.message ?? errorMessage
        } catch (_) {}
      }

      if (e instanceof Error) {
        errorMessage = e.message
      }

      await service.saveAssistantMessage(
        providedThreadId,
        [],
        userMessage.id,
        errorMessage,
        modelId,
      )

      return withCors(
        request,
        new ChatSDKError(
          'bad_request',
          'stream',
          e instanceof Error ? e.message : undefined,
        ).toResponse(),
      )
    }
  } catch (error) {
    console.error('Chat API error:', error)

    if (error instanceof AppError || error instanceof ChatSDKError) {
      return withCors(request, error.toResponse())
    }

    if (error instanceof Response) {
      return withCors(request, error)
    }

    const cause = error instanceof Error ? error.message : undefined
    return withCors(
      request,
      new ChatSDKError('bad_request', 'api', cause).toResponse(),
    )
  }
})
