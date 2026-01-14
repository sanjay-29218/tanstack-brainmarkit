import { usePaginatedQuery } from 'convex/react'
import { createContext, useContext, useEffect } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { observer } from 'mobx-react-lite'
import type { UIMessage } from 'ai'
import { api } from '@/lib/convex-api'
import ChatSession from '@/pages/chat/shared/ChatSession'
import { ChatSessionManager } from '@/pages/chat/shared/ChatSessionManager'
import { chatStore } from '@/stores/ChatStore'

interface ChatContextType {
  isChatsLoading: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}

const ChatContext = createContext<ChatContextType | null>(null)

export const ChatProvider = observer(function ChatProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const chatId = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => m.routeId === '/chat/$chatId')
      return (match?.params as { chatId?: string } | undefined)?.chatId
    },
  })

  const { results, status, loadMore } = usePaginatedQuery(
    api.chats.listWithMessages,
    { messageLimit: 50 },
    { initialNumItems: 30 },
  )

  const isChatsLoading = status === 'LoadingFirstPage'
  const isFetchingNextPage = status === 'LoadingMore'
  const hasNextPage = status === 'CanLoadMore'

  // Sync server data to ChatStore
  useEffect(() => {
    const chatsWithMessages = results
    const serverSessions = chatsWithMessages.map(
      (chat) =>
        new ChatSession(
          chat.id,
          chat.messages.map((message: any) => {
            const uiMessage: UIMessage = {
              id: message.id,
              role: message.role,
              parts: message.parts as UIMessage['parts'],
              metadata: {
                ...(message.errorMessage
                  ? { errorMessage: message.errorMessage }
                  : {}),
                ...(message.model ? { model: message.model } : {}),
                ...(message.parentMessageId
                  ? { parentMessageId: message.parentMessageId }
                  : {}),
                ...(message.childrenMessageIds
                  ? { childrenMessageIds: message.childrenMessageIds }
                  : { childrenMessageIds: [] }),
              },
            }
            return uiMessage
          }),
          chat.title,
          chat.model,
          undefined,
        ),
    )
    chatStore.syncServerSessions(serverSessions)
  }, [results])

  // Sync active chat ID to store - update immediately when route changes
  useEffect(() => {
    if (chatId) {
      chatStore.setActiveChatId(chatId)
    } else {
      chatStore.resetActiveChatId()
    }
  }, [chatId])

  return (
    <ChatContext.Provider
      value={{
        isChatsLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage: () => loadMore(30),
      }}
    >
      <ChatSessionManager />
      {children}
    </ChatContext.Provider>
  )
})

export const useUIChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useUIChat must be used within a ChatProvider')
  }
  return {
    ...context,
    chatStore,
  }
}
