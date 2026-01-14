import { useEffect, useMemo, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toJS, runInAction } from 'mobx'
import { useUIChat } from '@/providers/ChatProvider'
import { useChat, type UIMessage } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { fetchWithErrorHandlers } from '@/lib/utils'
import { toast } from 'sonner'
import { handlePopupError } from '@/error/error'
import ChatSession from './ChatSession'
import type ChatMessageModel from '../chat-preview/chat-message/ChatMessageModel'
import { useConvex, useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'
import { authClient } from '@/lib/auth-client'

const getChatApiURL = () => {
  const envUrl = (import.meta as unknown as { env?: Record<string, string | undefined> }).env
    ?.VITE_API_URL

  if (envUrl) {
    return `${envUrl}/api/stream`
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
        fetch: async (input, init) => {
          const sessionRes = await authClient.getSession()
          type SessionResponseData = {
            session?: { token?: string | null } | null
            token?: string | null
          }
          const data = (sessionRes as unknown as { data?: SessionResponseData | null })?.data
          const token = data?.session?.token ?? data?.token ?? null
          const headers = new Headers(init?.headers)
          if (token) {
            headers.set('Authorization', `Bearer ${token}`)
          }
          return fetchWithErrorHandlers(input, { ...init, headers })
        },
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
        if (chat.shouldRefetchAfterFinish) {
          chat.setShouldRefetchAfterFinish(false)
        }
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
      if (chat.shouldRefetchAfterFinish) {
        chat.setShouldRefetchAfterFinish(false)
      }

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
          ;(lastMessage as unknown as ChatMessageModel).errorMessage = error.message
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
        setMessages: (messages: UIMessage[]) => {
          setMessagesRef.current(messages)
        },
        stop: () => {
          void stopRef.current()
        },
        status,
      },
      chat.model,
    )

    if (chat.pendingMessage) {
      const plainMessage = toJS(chat.pendingMessage.uiMessage) as UIMessage
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

const showFreeMessageInfoToast = async (remainingMessages: number | null | undefined) => {
  if (!remainingMessages) return
  toast.info(
    `You have ${remainingMessages} free message${remainingMessages !== 1 ? 's' : ''} remaining`,
    {
      description: 'Add an API key in settings for unlimited messages',
    },
  )
}

