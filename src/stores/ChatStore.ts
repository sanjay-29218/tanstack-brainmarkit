import type ChatSession from '@/pages/chat/shared/ChatSession'
import { action, computed, makeObservable, observable } from 'mobx'

class ChatStore {
  chatSessions: Array<ChatSession> = []
  activeChatId?: string

  constructor() {
    makeObservable(this, {
      chatSessions: observable,
      activeChatId: observable,
      activeChatSession: computed,
      setChatSessions: action,
      addChatSession: action,
      removeChatSession: action,
      clearChatSessions: action,
      syncServerSessions: action,
      setActiveChatId: action,
      resetActiveChatId: action,
    })
  }

  get activeChatSession(): ChatSession | undefined {
    // This will be set by ChatProvider based on current route
    return this.activeChatId
      ? this.chatSessions.find((chat) => chat.id === this.activeChatId)
      : undefined
  }

  setActiveChatId(chatId: string | undefined) {
    this.activeChatId = chatId
  }

  resetActiveChatId() {
    this.activeChatId = undefined
  }

  setChatSessions(chatSessions: Array<ChatSession>) {
    this.chatSessions = chatSessions
  }

  addChatSession(session: ChatSession) {
    const existingIndex = this.chatSessions.findIndex(
      (s) => s.id === session.id,
    )
    if (existingIndex >= 0) {
      this.chatSessions[existingIndex] = session
    } else {
      this.chatSessions = [session, ...this.chatSessions]
    }
  }

  removeChatSession(chatId: string) {
    this.chatSessions = this.chatSessions.filter((s) => s.id !== chatId)
  }

  clearChatSessions() {
    this.chatSessions = []
  }

  syncServerSessions(serverSessions: Array<ChatSession>) {
    if (serverSessions.length === 0) return

    // Keep existing ChatSession instances so UI-only state isn't reset when we refetch.
    const existingSessions = this.chatSessions
    const existingById = new Map<string, ChatSession>()
    for (const existing of existingSessions) {
      existingById.set(existing.id, existing)
    }

    const serverIds = new Set<string>()
    for (const s of serverSessions) {
      serverIds.add(s.id)
    }

    const merged: Array<ChatSession> = []
    for (const serverSession of serverSessions) {
      const existing = existingById.get(serverSession.id)
      if (!existing) {
        merged.push(serverSession)
        continue
      }

      existing.title = serverSession.title
      if (serverSession.model) {
        existing.setModel(serverSession.model)
      }
      if (existing.isNew) {
        existing.setIsNew(false)
      }

      // Don't clobber an in-flight stream with server snapshots.
      if (!existing.isStreaming) {
        existing.setAllMessages(
          serverSession.allMessages.map((m) => m.uiMessage),
        )

        if (existing.chatApi) {
          existing.chatApi.setMessages(
            existing.messages.map((m) => ({
              ...m.uiMessage,
              metadata:
                (m.uiMessage.metadata as Record<string, unknown> | undefined) ??
                {},
            })),
          )
        }
      }

      merged.push(existing)
    }

    // Preserve local-only sessions that haven't been persisted yet.
    const localUnsynced = existingSessions.filter((s) => {
      if (serverIds.has(s.id)) return false
      return !!(s.isNew || s.pendingMessage)
    })

    this.chatSessions = [...localUnsynced, ...merged]
  }
}

export const chatStore = new ChatStore()
