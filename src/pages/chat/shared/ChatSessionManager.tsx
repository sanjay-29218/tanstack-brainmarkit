import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toJS, runInAction } from 'mobx'
import { useUIChat } from '@/providers/ChatProvider'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { fetchWithErrorHandlers } from '@/lib/utils'
import { toast } from 'sonner'
import { handlePopupError } from '@/error/error'
import type ChatSession from './ChatSession'
import type ChatMessageModel from '../chat-preview/chat-message/ChatMessageModel'
import { useConvex, useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'

const getChatApiURL = () => {
  return '/stream'
}

const createServerFnFetch = () => {
  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const rawBody = init?.body ? JSON.parse(init.body as string) : undefined
    const headers = new Headers(init?.headers)
    headers.set('x-tsr-serverFn', 'true')
    headers.set('Content-Type', 'application/json')

    return fetchWithErrorHandlers(url, {
      ...init,
      method: 'POST',
      headers,
      body: JSON.stringify({ data: rawBody }),
    })
  }
}

function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return <>{children}</>
}

export const ChatSessionManager = observer(function ChatSessionManager() {
  const { chatStore } = useUIChat()

  return (
    <ClientOnly>
      {chatStore.chatSessions.map((chat) => (
        <ChatSessionController key={chat.id} chat={chat} />
      ))}
    </ClientOnly>
  )
})

const ChatSessionController = observer(function ChatSessionController({
  chat,
}: {
  chat: ChatSession
}) {
  const { chatStore } = useUIChat()
  const convex = useConvex()
  const freeMessageInfo = useQuery(api.apiKeys.getFreeMessageInfo)

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: getChatApiURL(),
        fetch: createServerFnFetch(),
        prepareSendMessagesRequest(req) {
          const threadIdForRequest = chat.id
          const userMsg = req.messages.at(-1)
          const prevMessages = req.messages.slice(0, -1)
          return {
            body: {
              threadId: threadIdForRequest,
              userMessage: userMsg,
              prevMessages: prevMessages,
              model: chat.model,
              ...req.body,
            },
          }
        },
        // Send Convex auth cookies cross-origin.
        credentials: 'include',
      }),
    [chat.id, chat.model],
  )

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: chat.id,
    messages: chat.getActiveBranchUiMessagesWithParts(),
    transport,
    onFinish: async (data) => {
      if (chat.isNew) {
        chat.setIsNew(false)
      }
      let messagesForSession = data.messages

      if (data.isAbort) {
        const lastMessage = data.messages.at(-1)
        const newMessages = data.messages.map((message) => {
          if (message.id === lastMessage?.id) {
            return {
              ...message,
              metadata: { errorMessage: 'Stopped by user' },
            }
          }
          return message
        })
        setMessages(newMessages)
        messagesForSession = newMessages
      }

      chat.setMessages(messagesForSession)

      const currentHasApiKeys = freeMessageInfo?.hasApiKeys ?? false

      if (!currentHasApiKeys) {
        const updatedInfo = await convex.query(api.apiKeys.getFreeMessageInfo)
        showFreeMessageInfoToast(updatedInfo.remainingMessages)
      }
    },
    onError: (error: Error) => {
      console.error('ChatSessionManager error', error)
      const lastMessage = messages.at(-1)
      if (lastMessage) {
        runInAction(() => {
          ;(lastMessage as unknown as ChatMessageModel).errorMessage =
            error.message
        })
      }
      handlePopupError(error)
    },
  })

  const stopRef = useRef(stop)
  const sendMessageRef = useRef(sendMessage)
  const setMessagesRef = useRef(setMessages)
  useEffect(() => {
    stopRef.current = stop
    sendMessageRef.current = sendMessage
    setMessagesRef.current = setMessages
  }, [stop, sendMessage, setMessages])

  useEffect(() => {
    if (chat.chatApi) return
    chat.init(
      messages,
      status,
      {
        send: (userMessage: UIMessage) => {
          chat.setShowFullHeight(true)
          void sendMessageRef.current(userMessage)
        },
        setMessages: (nextMessages: Array<UIMessage>) => {
          setMessagesRef.current(nextMessages)
        },
        stop: () => {
          void stopRef.current()
        },
        status,
      },
      chat.model,
    )

    if (chat.pendingMessage) {
      const plainMessage = toJS(chat.pendingMessage.uiMessage)
      void sendMessageRef.current(plainMessage)
      chat.clearPendingMessage()
    }
  }, [chat, messages, status])

  useEffect(() => {
    if (chat.id === chatStore.activeChatId) {
      chat.setStreamingMessage(messages.at(-1))
    }
    chat.setStreamingStatus(status)
  }, [messages, status, chat, chatStore.activeChatId])

  return null
})

const showFreeMessageInfoToast = (
  remainingMessages: number | null | undefined,
) => {
  if (!remainingMessages) return
  toast.info(
    `You have ${remainingMessages} free message${remainingMessages !== 1 ? 's' : ''} remaining`,
    {
      description: 'Add an API key in settings for unlimited messages',
    },
  )
}
