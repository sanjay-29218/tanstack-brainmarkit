import {
  streamText,
  convertToModelMessages,
  consumeStream,
  smoothStream,
  generateText,
  type LanguageModel,
  type UIMessage,
  generateId,
} from 'ai'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import type { PostRequestBody } from '../../../convex/lib/schema'
import { api } from '@/lib/convex-api'
import { fetchAuthQuery, fetchAuthMutation } from '@/lib/auth-server'

const FREE_TIER_MESSAGE_LIMIT = 10
export const FREE_TIER_ALLOWED_MODEL = 'mistralai/devstral-2512:free'

export class StreamService {
  async checkUserHasApiKeys(): Promise<boolean> {
    const res = await fetchAuthQuery(api.apiKeys.hasActiveKeys, {})
    return res.hasApiKeys
  }

  async checkFreeMessageLimit(): Promise<void> {
    const info = await fetchAuthQuery(api.apiKeys.getFreeMessageInfo, {})

    if (!info.hasApiKeys) {
      const remaining = info.remainingMessages ?? FREE_TIER_MESSAGE_LIMIT
      if (remaining <= 0) {
        throw new Error(
          'You have exceeded your maximum number of messages for the day. Please try again later.',
        )
      }
    }
  }

  async incrementFreeMessageCount(): Promise<void> {
    await fetchAuthMutation(api.users.incrementFreeMessageCount, {})
  }

  async getOpenRouterApiKey(): Promise<string> {
    return await fetchAuthQuery(api.apiKeys.getOpenRouterKey, {})
  }

  getSystemOpenRouterApiKey(): string {
    const systemKey = process.env.OPENROUTER_API_KEY
    if (!systemKey) {
      throw new Error(
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
    const result = await fetchAuthMutation(api.chats.getOrUpdateThread, {
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

    await fetchAuthMutation(api.messages.saveUserMessage, {
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

    await fetchAuthMutation(api.messages.saveAssistantMessage, {
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

        try {
          await this.saveAssistantMessage(
            threadId,
            parts,
            userMessageId,
            undefined,
            modelId,
            assistantMessageId,
          )
        } catch (e) {
          console.error('Failed to save assistant message on finish:', e)
        }
      },
      experimental_transform: smoothStream({
        chunking: 'word',
      }),
      abortSignal,
      onChunk: (chunk) => {
        if (chunk.chunk.type === 'text-delta') {
          partialAssistantText += chunk.chunk.text
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

        try {
          await this.saveAssistantMessage(
            threadId,
            parts,
            userMessageId,
            'Stopped by user',
            modelId,
            assistantMessageId,
          )
        } catch (e) {
          console.error('Failed to save assistant message on abort:', e)
        }
      },
      onError: async (error: any) => {
        let errorMessage = 'AI failed to generate response'
        if (error instanceof Error) {
          errorMessage = error.message
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

        try {
          await this.saveAssistantMessage(
            threadId,
            parts,
            userMessageId,
            errorMessage,
            modelId,
            assistantMessageId,
          )
        } catch (e) {
          console.error('Failed to save assistant message on error:', e)
        }
      },
    })

    return result.toUIMessageStreamResponse({
      consumeSseStream: consumeStream,
      originalMessages: messages as any,
      generateMessageId: () => assistantMessageId,
    })
  }
}
