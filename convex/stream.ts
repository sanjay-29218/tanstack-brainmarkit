'use node '
import { action } from './_generated/server'
import { postRequestBodySchema } from './lib/schema'
import { StreamService, FREE_TIER_ALLOWED_MODEL } from './lib/stream_service'
import { AppError, ChatSDKError } from './lib/errors'
import type { UIMessage } from 'ai'
import { api } from './_generated/api'
import { v } from 'convex/values'

export const stream = action({
  args: {
    threadId: v.string(),
    userMessage: v.object({
      id: v.string(),
      role: v.string(),
      parts: v.array(v.object({ type: v.string(), text: v.string() })),
    }),
    prevMessages: v.array(
      v.object({
        id: v.string(),
        role: v.string(),
        parts: v.array(v.object({ type: v.string(), text: v.string() })),
      }),
    ),
    model: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const service = new StreamService(ctx)

      // Ensure user exists in Convex for usage tracking
      await ctx.runMutation(api.users.ensure, {})

      // Request validation
      const res = postRequestBodySchema.safeParse(args)

      if (!res.data)
        throw new ChatSDKError('bad_request', 'auth', 'Invalid request body')

      const { threadId, userMessage, prevMessages, model } = res.data
      const modelId = model || FREE_TIER_ALLOWED_MODEL

      // Check if user has API keys
      const hasApiKeys = await service.checkUserHasApiKeys()

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
            if (part.type === 'text') return part.text
            if (part.type === 'file') return part.filename
            return ''
          })
          .join(' ')

        let title: string
        try {
          const titleModel = service.getFreeTierModel()
          title = await service.generateThreadTitle(
            titleModel,
            userMessageContent,
          )
        } catch (err) {
          title =
            userMessageContent?.split(' ').slice(0, 4).join(' ') || 'New Chat'
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
        ...prevMessages.map((message: UIMessage) => ({
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
        )

        if (!hasApiKeys) {
          await service.incrementFreeMessageCount()
        }

        return streamResponse
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
      }
    } catch (error) {
      console.error('Chat API error:', error)
    }
    return null
  },
})
