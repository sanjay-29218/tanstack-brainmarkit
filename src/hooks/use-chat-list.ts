import { useUIChat } from '@/providers/ChatProvider'
import { useMutation } from 'convex/react'
import { api } from '@/lib/convex-api'
import { useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

export function useChatList(setOpenWarningModal: () => void) {
  const navigate = useNavigate()
  const { chatStore } = useUIChat()
  const [isDeleting, setIsDeleting] = useState(false)

  const activeChatId = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => m.routeId === '/chat/$chatId')
      return (match?.params as { chatId?: string } | undefined)?.chatId
    },
  })

  const deleteChat = useMutation(api.chats.deleteChat)

  const deleteChatById = async (id: string) => {
    try {
      setIsDeleting(true)
      await deleteChat({ threadId: id })
      chatStore.removeChatSession(id)
      if (id === activeChatId) {
        void navigate({ to: '/' })
      }
      setOpenWarningModal()
    } catch (error) {
      console.error(error)
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    deleteChatById,
    isDeleting,
    activeChatId,
  } as const
}

