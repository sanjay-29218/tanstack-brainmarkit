import {
  streamText,
  convertToModelMessages,
  generateText,
  consumeStream,
  smoothStream,
  type LanguageModel,
  type UIMessage,
  generateId,
} from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { PostRequestBody } from './schema'
import { AppError } from './errors'
import type { ActionCtx } from '../_generated/server'
import { api } from '../_generated/api'

const FREE_TIER_MESSAGE_LIMIT = 10
export const FREE_TIER_ALLOWED_MODEL = 'mistralai/devstral-2512:free'

export class StreamService {
  private ctx: ActionCtx

  constructor(ctx: ActionCtx) {
    this.ctx = ctx
  }

  async checkUserHasApiKeys(): Promise<boolean> {
    const res = await this.ctx.runQuery(api.apiKeys.hasActiveKeys)
    return res.hasApiKeys
  }

  async checkFreeMessageLimit(): Promise<void> {
    const info = await this.ctx.runQuery(api.apiKeys.getFreeMessageInfo)

    if (!info.hasApiKeys) {
      const remaining = info.remainingMessages ?? FREE_TIER_MESSAGE_LIMIT
      if (remaining <= 0) {
        const error = new AppError(
          'rate_limit',
          'chat',
          'You have exceeded your maximum number of messages for the day. Please try again later.',
        )
        throw error
      }
    }
  }

  async incrementFreeMessageCount(): Promise<void> {
    await this.ctx.runMutation(api.users.incrementFreeMessageCount, {})
  }

  async getOpenRouterApiKey(): Promise<string> {
    return await this.ctx.runQuery(api.apiKeys.getOpenRouterKey)
  }

  getSystemOpenRouterApiKey(): string {
    const systemKey = process.env.OPENROUTER_API_KEY
    if (!systemKey) {
      throw new AppError(
        'bad_request',
        'api_key',
        'System API key not configured. Please add OPENROUTER_API_KEY to environment variables to use free tier models.',
      )
    }
    return systemKey
  }

  getFreeTierModel(): LanguageModel {
    const systemApiKey = this.getSystemOpenRouterApiKey()
    const openrouter = createOpenRouter({
      apiKey: systemApiKey,
    })
    return openrouter(FREE_TIER_ALLOWED_MODEL)
  }

  async selectModel(
    modelId: string,
    hasApiKeys: boolean,
  ): Promise<LanguageModel> {
    if (!hasApiKeys) {
      const systemApiKey = this.getSystemOpenRouterApiKey()
      const openrouter = createOpenRouter({
        apiKey: systemApiKey,
      })
      return openrouter(modelId)
    }

    const openRouterApiKey = await this.getOpenRouterApiKey()
    const openrouter = createOpenRouter({
      apiKey: openRouterApiKey,
    })
    return openrouter(modelId)
  }

  async getOrCreateThread(
    threadId: string,
    modelId: string,
  ): Promise<{ id: string; isNew: boolean }> {
    const result = await this.ctx.runMutation(api.chats.getOrUpdateThread, {
      threadId,
      model: modelId,
    })
    return { id: result.id, isNew: result.isNew }
  }

  async generateThreadTitle(
    model: LanguageModel,
    userMessageContent: string,
  ): Promise<string> {
    const generatedTitle = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates titles for chats. make it short and concise. Even if the user message is small and not meaningful, generate a title for it. Max 4 words.',
        },
        {
          role: 'user',
          content: `Generate a title for the following chat: ${userMessageContent}`,
        },
      ],
    })

    return generatedTitle.text.split(' ').slice(0, 4).join(' ')
  }

  async createThread(
    threadId: string,
    title: string,
    modelId: string,
  ): Promise<string> {
    const created = await this.ctx.runMutation(api.chats.createThread, {
      threadId,
      title,
      model: modelId,
    })
    return created.id
  }

  async saveUserMessage(
    threadId: string,
    userMessage: PostRequestBody['userMessage'],
    previousMessageId?: string,
    modelName?: string,
  ): Promise<void> {
    const sanitizedPreviousMessageId =
      previousMessageId && previousMessageId !== userMessage.id
        ? previousMessageId
        : undefined

    await this.ctx.runMutation(api.messages.saveUserMessage, {
      threadId,
      messageId: userMessage.id,
      parts: userMessage.parts,
      parentMessageId: sanitizedPreviousMessageId,
      model: modelName,
    })
  }

  async saveAssistantMessage(
    threadId: string,
    parts: UIMessage['parts'],
    parentMessageId: string,
    errorMessage?: string,
    modelName?: string,
    assistantMessageId?: string,
  ): Promise<string> {
    const resolvedAssistantMessageId = assistantMessageId || generateId()

    await this.ctx.runMutation(api.messages.saveAssistantMessage, {
      threadId,
      messageId: resolvedAssistantMessageId,
      parts: parts,
      parentMessageId,
      errorMessage: errorMessage ?? undefined,
      model: modelName,
    })

    return resolvedAssistantMessageId
  }

  async streamChatResponse(
    model: LanguageModel,
    messages: Array<UIMessage>,
    threadId: string,
    userMessageId: string,
    modelId: string,
    abortSignal?: AbortSignal,
    onChunkCallback?: (text: string) => void,
  ): Promise<Response> {
    let partialAssistantText = ''
    let partialReasoningText = ''
    const assistantMessageId = generateId()

    const result = streamText({
      model,
      messages: await convertToModelMessages(messages),
      onFinish: async (result) => {
        const parts: UIMessage['parts'] = []

        if (partialReasoningText.trim()) {
          parts.push({
            type: 'reasoning',
            text: partialReasoningText,
            state: 'done',
          })
        }

        if (result.text.trim()) {
          parts.push({
            type: 'text',
            text: result.text,
          })
        }

        await this.saveAssistantMessage(
          threadId,
          parts,
          userMessageId,
          undefined,
          modelId,
          assistantMessageId,
        )
      },
      experimental_transform: smoothStream({
        chunking: 'word',
      }),
      abortSignal,
      onChunk: (chunk) => {
        if (chunk.chunk.type === 'text-delta') {
          partialAssistantText += chunk.chunk.text
          onChunkCallback?.(partialAssistantText)
        } else if (chunk.chunk.type === 'reasoning-delta') {
          partialReasoningText += chunk.chunk.text
        }
      },
      onAbort: async () => {
        const parts: UIMessage['parts'] = []

        if (partialReasoningText.trim()) {
          parts.push({
            type: 'reasoning',
            text: partialReasoningText,
            state: 'done',
          })
        }

        if (partialAssistantText.trim()) {
          parts.push({
            type: 'text',
            text: partialAssistantText,
          })
        }

        await this.saveAssistantMessage(
          threadId,
          parts,
          userMessageId,
          'Stopped by user',
          modelId,
          assistantMessageId,
        )
      },
      onError: async (error: any) => {
        let errorMessage = 'AI failed to generate response'
        try {
          const parsed = JSON.parse(error?.error?.responseBody ?? '{}')
          console.error('Chat API error:', parsed?.error?.status)
          errorMessage = parsed?.error?.message ?? errorMessage
        } catch (e) {
          console.error('Chat API error (unparsed)', error)
          if (error instanceof Error) {
            errorMessage = error.message
          }
        }
        const parts: UIMessage['parts'] = []

        if (partialReasoningText.trim()) {
          parts.push({
            type: 'reasoning',
            text: partialReasoningText,
            state: 'done',
          })
        }

        if (partialAssistantText.trim()) {
          parts.push({
            type: 'text',
            text: partialAssistantText,
          })
        }

        await this.saveAssistantMessage(
          threadId,
          parts,
          userMessageId,
          errorMessage,
          modelId,
          assistantMessageId,
        )
      },
    })

    return result.toUIMessageStreamResponse({
      consumeSseStream: consumeStream,
      originalMessages: messages as any,
      generateMessageId: () => assistantMessageId,
    })
  }
}
