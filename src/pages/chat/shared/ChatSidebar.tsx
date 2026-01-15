import type { User } from 'better-auth'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Settings, LogOut, Trash, Loader2, LogIn } from 'lucide-react'
import { useState, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import SettingCard from '@/pages/setting/SettingModal'
import { TooltipText } from '@/components/ui/tooltip'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import Modal, { WarningModal } from '@/components/ui-element/Modal'
import { authClient } from '@/lib/auth-client'
import { useUIChat } from '@/providers/ChatProvider'
import { useChatList } from '@/hooks/use-chat-list'
import type ChatSession from './ChatSession'
import { observer } from 'mobx-react-lite'

const { useSession } = authClient

const ChatSidebar = observer(function ChatSidebar() {
  const navigate = useNavigate()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { data: session, isPending: isSessionLoading } = useSession()
  const { chatStore } = useUIChat()
  const user = session?.user

  return (
    <Sidebar collapsible="offcanvas" className="border-r pb-4">
      <SidebarRail />
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <TooltipText
              text="You need to be logged in to create a new chat"
              disabled={!!user}
            >
              <SidebarMenuButton asChild size="lg">
                <Link
                  to="/"
                  onClick={(e) => {
                    if (!user) {
                      e.preventDefault()
                      return
                    }
                    chatStore.resetActiveChatId()
                    localStorage.removeItem('active_chat_id')
                  }}
                  className="w-full justify-start gap-2"
                >
                  New chat
                </Link>
              </SidebarMenuButton>
            </TooltipText>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <ChatList user={user ?? null} isSessionLoading={isSessionLoading} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {user && !isSessionLoading && (
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setSettingsOpen(true)}
                variant={'default'}
              >
                <Settings className="size-4" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        {!user && !isSessionLoading && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link to="/login">
                <LogIn className="size-4" />
                <span>Sign In</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {user && !isSessionLoading && (
          <SidebarMenuItem>
            <SidebarMenuButton>
              <Avatar className="size-5">
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="truncate">{user.name}</span>
            </SidebarMenuButton>

            <TooltipText text="Sign out">
              <SidebarMenuAction
                aria-label="More"
                onClick={() =>
                  authClient.signOut(
                    {},
                    {
                      onSuccess: () => {
                        chatStore.clearChatSessions()
                        localStorage.removeItem('active_chat_id')
                        localStorage.removeItem('selectedModel')
                        void navigate({ to: '/' })
                      },
                      onError: () => {},
                    },
                  )
                }
                className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-pointer"
              >
                <LogOut className="size-4" />
              </SidebarMenuAction>
            </TooltipText>
          </SidebarMenuItem>
        )}
      </SidebarFooter>

      <Modal
        title="Settings"
        description="Manage your settings and preferences."
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        preventOutsideClose={true}
        className="sm:max-w-3xl"
      >
        <SettingCard />
      </Modal>
    </Sidebar>
  )
})

const ChatList = observer(function ChatList({
  user,
  isSessionLoading,
}: {
  user: User | null
  isSessionLoading: boolean
}) {
  const {
    chatStore,
    isChatsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useUIChat()

  const chatSessions = chatStore.chatSessions

  const [openWarningModal, setOpenWarningModal] = useState<{
    id: string
    open: boolean
  } | null>(null)

  const { deleteChatById, isDeleting } = useChatList(() =>
    setOpenWarningModal({ id: '', open: false }),
  )

  const handleDelete = useCallback((id: string) => {
    setOpenWarningModal({ id, open: true })
  }, [])

  const handleFetchNextPage = useCallback(() => {
    void fetchNextPage()
  }, [fetchNextPage])

  if (
    !isSessionLoading &&
    !user &&
    !isChatsLoading &&
    chatSessions.length === 0
  ) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton>Sign in to see your chats</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      {isChatsLoading && (
        <>
          {Array.from({ length: 6 }).map((_, i) => (
            <SidebarMenuItem key={`s-${i}`}>
              <div className="w-full px-2 py-1.5">
                <Skeleton className="h-5 w-full" />
              </div>
            </SidebarMenuItem>
          ))}
        </>
      )}

      {chatSessions.length === 0 && !isChatsLoading && (
        <SidebarMenuItem>
          <SidebarMenuButton>No chats yet</SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {chatSessions.map((chat) => (
        <ChatSidebarItem
          chat={chat}
          key={chat.id}
          onDelete={handleDelete}
          deletingChatId={isDeleting ? openWarningModal?.id : undefined}
        />
      ))}

      {hasNextPage && (
        <SidebarMenuItem>
          <div className="w-full px-2 py-2">
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" /> Loading more...
              </div>
            ) : (
              <div
                className="text-center text-xs text-muted-foreground"
                onClick={handleFetchNextPage}
              >
                Scroll to load more
              </div>
            )}
          </div>
        </SidebarMenuItem>
      )}

      <WarningModal
        title="Delete Chat"
        description="Are you sure you want to delete this chat?"
        open={openWarningModal?.open ?? false}
        onConfirm={() => {
          const id = openWarningModal?.id ?? ''
          deleteChatById(id)
        }}
        onClose={() => {
          setOpenWarningModal(null)
        }}
        isLoading={isDeleting}
      />
    </SidebarMenu>
  )
})

const ChatSidebarItem = observer(function ChatSidebarItem({
  chat,
  onDelete,
  deletingChatId,
}: {
  chat: ChatSession
  onDelete: (id: string) => void
  deletingChatId?: string
}) {
  const navigate = useNavigate()
  const routeChatId = useRouterState({
    select: (s) => {
      const match = s.matches.find((m) => m.routeId === '/chat/$chatId')
      return (match?.params as { chatId?: string } | undefined)?.chatId
    },
  })
  const { chatStore } = useUIChat()

  const isDeleting = chat.id === deletingChatId
  const currentActiveId = chatStore.activeChatId || routeChatId
  const isActive = chat.id === currentActiveId
  const isStreaming = chat.isStreaming || false

  const onRouteChange = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.preventDefault()
      if (!isStreaming) {
        chat.setShowFullHeight(false)
      }
      chatStore.setActiveChatId(id)
      navigate({ to: '/chat/$chatId', params: { chatId: id } })
    },
    [navigate, chatStore, chat, isStreaming],
  )

  return (
    <SidebarMenuItem key={chat.id}>
      <SidebarMenuButton asChild isActive={isActive} className="w-full">
        <button
          onClick={(e) => onRouteChange(e, chat.id)}
          className="w-full truncate text-left"
        >
          {chat.title}
        </button>
      </SidebarMenuButton>
      <SidebarMenuAction onClick={() => !isStreaming && onDelete(chat.id)}>
        {isStreaming || isDeleting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash className="size-4 text-red-500 cursor-pointer" />
        )}
      </SidebarMenuAction>
    </SidebarMenuItem>
  )
})

export default ChatSidebar
