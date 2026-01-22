import { fetchAuthMutation } from '@/lib/auth-server'
import { createFileRoute } from '@tanstack/react-router'
import type { UIMessage } from 'ai'
import { api } from '@/lib/convex-api'
import { postRequestBodySchema } from '../../convex/lib/schema'
import {
  FREE_TIER_ALLOWED_MODEL,
  StreamService,
} from '@/server/stream/stream.service'

export const Route = createFileRoute('/stream')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json()
          const parsed = postRequestBodySchema.safeParse(body.data)
          if (!parsed.success) {
            return new Response(
              JSON.stringify({
                error: 'Please provide valid data',
                issues: parsed.error.issues,
              }),
              {
                status: 400,
                headers: { 'content-type': 'application/json' },
              },
            )
          }
          const data = parsed.data
          const service = new StreamService()

          // Ensure user exists in Convex for usage tracking
          await fetchAuthMutation(api.users.ensure, {})

          const { threadId, userMessage, prevMessages, model } = data
          const modelId = model || FREE_TIER_ALLOWED_MODEL

          // Check if user has API keys
          const hasApiKeys = await service.checkUserHasApiKeys()

          // Select appropriate model
          const selectedModel = await service.selectModel(modelId, hasApiKeys)

          // Get or create thread
          const { id: providedThreadId, isNew } =
            await service.getOrCreateThread(threadId, modelId)

          // Generate title and create thread if new
          if (isNew) {
            const userMessageContent = userMessage.parts
              .map((part: any) => {
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
                userMessageContent.split(' ').slice(0, 4).join(' ') ||
                'New Chat'
              console.error('Title generation failed, using fallback:', err)
            }

            try {
              await fetchAuthMutation(api.chats.createThread, {
                threadId: providedThreadId,
                title,
                model: modelId,
              })
            } catch (error) {
              console.error('Failed to create thread:', error)
              throw new Error('Failed to create thread')
            }
          }

          const previousMessage = [...prevMessages]
            .reverse()
            .find((message: UIMessage) => message.id !== userMessage.id)

          await service.saveUserMessage(
            providedThreadId,
            userMessage,
            previousMessage?.id,
            modelId,
          )

          if (!hasApiKeys) {
            try {
              await service.checkFreeMessageLimit()
            } catch (limitError: any) {
              const errorText = limitError.message
              await service.saveAssistantMessage(
                providedThreadId,
                [],
                userMessage.id,
                errorText,
                modelId,
              )
              return new Response(JSON.stringify({ error: errorText }), {
                status: 429,
                headers: { 'content-type': 'application/json' },
              })
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
          ] as Array<UIMessage>

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
        } catch (error) {
          console.error('Chat API error:', error)
          if (error instanceof Response) {
            return error
          }
          const message =
            error instanceof Error ? error.message : 'Unknown error'
          return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { 'content-type': 'application/json' },
          })
        }
      },
    },
  },
})
