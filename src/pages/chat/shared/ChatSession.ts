import type { ChatStatus, UIMessage } from 'ai'
import { action, makeObservable, observable } from 'mobx'
import ChatMessageModel from '../chat-preview/chat-message/ChatMessageModel'

const ROOT_PARENT_KEY = '__root__'

interface ChatApi {
  send: (userMessage: UIMessage) => void
  setMessages: (messages: Array<UIMessage>) => void
  stop: () => void
  status: ChatStatus
}

export interface StreamingContent {
  text?: string
  code?: string
  lang?: string
  type: 'text' | 'code'
  id?: string
  start?: number
  end?: number
  isCodeCompleted?: boolean
}

export default class ChatSession {
  id: string // thread id
  title?: string
  messages: Array<ChatMessageModel> // active branch (visible messages)
  allMessages: Array<ChatMessageModel> // all messages (tree)
  status: ChatStatus
  model: string
  chatApi?: ChatApi
  isStreaming?: boolean
  pendingMessage?: ChatMessageModel | null
  isNew?: boolean
  showFullHeight?: boolean
  selectedChildByParentId: Map<string, string>

  constructor(
    id: string,
    messages: Array<UIMessage>,
    title?: string,
    model?: string,
    chatApi?: ChatApi,
    isNew: boolean = false,
  ) {
    this.id = id
    this.allMessages = messages.map((message) => new ChatMessageModel(message))
    this.messages = []
    this.status = 'ready'
    this.title = title
    this.model = model ?? 'gemini-2.5-flash'
    this.chatApi = chatApi
    this.isNew = isNew
    this.selectedChildByParentId = new Map()
    makeObservable(this, {
      status: observable,
      isStreaming: observable,
      messages: observable,
      setMessages: action,
      allMessages: observable,
      setAllMessages: action,
      init: action,
      chatApi: observable,
      setChatApi: action,
      isNew: observable,
      setIsNew: action,
      model: observable,
      setModel: action,
      pendingMessage: observable,
      setPendingMessage: action,
      clearPendingMessage: action,
      showFullHeight: observable,
      setShowFullHeight: action,
      setStreamingStatus: action,
      setStreamingMessage: action,
      selectedChildByParentId: observable,
      selectSiblingMessageVersion: action,
      selectChildForParentMessage: action,
    })

    this.recomputeActiveBranchMessages()
  }

  private recomputeActiveBranchMessages() {
    if (this.allMessages.length === 0) {
      this.messages = []
      return
    }

    const messageById = new Map<string, ChatMessageModel>()
    for (const m of this.allMessages) {
      messageById.set(m.id, m)
    }

    const rootIds = this.getChildMessageIds(ROOT_PARENT_KEY, messageById)
    const selectedRootId = this.selectedChildByParentId.get(ROOT_PARENT_KEY)
    const resolvedRootId =
      selectedRootId && rootIds.includes(selectedRootId)
        ? selectedRootId
        : rootIds[rootIds.length - 1]
    const root = resolvedRootId ? messageById.get(resolvedRootId) : undefined
    const fallbackRoot =
      root ??
      this.allMessages.find((m) => !m.parentMessageId?.trim()) ??
      this.allMessages[0]

    const nextMessages: Array<ChatMessageModel> = []
    const visited = new Set<string>()
    let current: ChatMessageModel | undefined = fallbackRoot

    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      nextMessages.push(current)

      const childIds = this.getChildMessageIds(current.id, messageById)
      if (childIds.length === 0) break

      const selectedChildId = this.selectedChildByParentId.get(current.id)
      const resolvedChildId =
        selectedChildId && childIds.includes(selectedChildId)
          ? selectedChildId
          : childIds[childIds.length - 1]

      if (!resolvedChildId) break
      current = messageById.get(resolvedChildId)
    }

    this.messages = nextMessages
  }

  private getChildMessageIds(
    parentId: string,
    messageById: Map<string, ChatMessageModel>,
  ): Array<string> {
    if (parentId === ROOT_PARENT_KEY) {
      const rootIds: Array<string> = []
      for (const m of this.allMessages) {
        if (m.parentMessageId && m.parentMessageId.trim()) continue
        if (!messageById.has(m.id)) continue
        rootIds.push(m.id)
      }
      return rootIds
    }

    const parent = messageById.get(parentId)
    const declared = (parent?.childrenMessageIds ?? []).filter((id) =>
      messageById.has(id),
    )
    if (declared.length > 0) return declared

    const derived: Array<string> = []
    for (const m of this.allMessages) {
      if (m.parentMessageId === parentId) {
        derived.push(m.id)
      }
    }
    return derived
  }

  private toUiMessageWithParts(message: ChatMessageModel): UIMessage {
    const base = message.uiMessage
    const baseMetadata =
      (base.metadata as Record<string, unknown> | undefined) ?? {}

    if (Array.isArray(base.parts) && base.parts.length > 0) {
      return { ...base, metadata: baseMetadata }
    }

    const parts: UIMessage['parts'] = []

    if (message.reasoningParts.length > 0) {
      parts.push(...(message.reasoningParts as unknown as UIMessage['parts']))
    }

    if (message.role === 'user') {
      if (message.text.trim()) {
        parts.push({ type: 'text', text: message.text })
      }
      if (message.files.length > 0) {
        parts.push(...(message.files as unknown as UIMessage['parts']))
      }
      return { ...base, parts, metadata: baseMetadata }
    }

    if (message.text.trim()) {
      parts.push({ type: 'text', text: message.text })
    }

    return { ...base, parts, metadata: baseMetadata }
  }

  getUiMessagesWithParts(messages: Array<ChatMessageModel>): Array<UIMessage> {
    return messages.map((m) => this.toUiMessageWithParts(m))
  }

  getActiveBranchUiMessagesWithParts(): Array<UIMessage> {
    return this.getUiMessagesWithParts(this.messages)
  }

  private normalizeLinearMessages(
    messages: Array<UIMessage>,
  ): Array<UIMessage> {
    if (messages.length === 0) return []

    return messages.map((message, index) => {
      const previousMessageId = index > 0 ? messages[index - 1]?.id : ''
      const metadata =
        (message.metadata as
          | {
              parentMessageId?: string
              childrenMessageIds?: Array<string>
            }
          | undefined) ?? {}

      const parentMessageId =
        metadata.parentMessageId ?? (index === 0 ? '' : previousMessageId)

      return {
        ...message,
        metadata: {
          ...metadata,
          parentMessageId,
          childrenMessageIds: metadata.childrenMessageIds ?? [],
        },
      }
    })
  }

  init(
    messages: Array<UIMessage>,
    status: ChatStatus,
    api: ChatApi,
    model: string,
  ) {
    this.status = status
    this.chatApi = api
    this.model = model

    if (messages.length === 0) {
      if (this.allMessages.length === 0) {
        this.messages = []
      }
      return
    }

    if (this.allMessages.length === 0) {
      const normalizedMessages = this.normalizeLinearMessages(messages)
      this.allMessages = normalizedMessages.map(
        (message) => new ChatMessageModel(message),
      )
      this.recomputeActiveBranchMessages()
      return
    }

    this.setMessages(messages)
  }

  setChatApi(chatApi: ChatApi) {
    this.chatApi = chatApi
  }

  setAllMessages(messages: Array<UIMessage>) {
    this.allMessages = messages.map((message) => new ChatMessageModel(message))
    this.recomputeActiveBranchMessages()
  }

  setMessages(messages: Array<UIMessage>) {
    const normalizedMessages = this.normalizeLinearMessages(messages)
    const nextBranchMessages = normalizedMessages.map(
      (message) => new ChatMessageModel(message),
    )

    const nextSelectedChildByParentId = new Map<string, string>()
    const firstMessageId = nextBranchMessages[0]?.id
    if (firstMessageId) {
      nextSelectedChildByParentId.set(ROOT_PARENT_KEY, firstMessageId)
    }
    for (let index = 1; index < nextBranchMessages.length; index += 1) {
      const parentId = nextBranchMessages[index - 1]?.id
      const childId = nextBranchMessages[index]?.id
      if (!parentId) continue
      if (!childId) continue
      nextSelectedChildByParentId.set(parentId, childId)
    }
    this.selectedChildByParentId = nextSelectedChildByParentId

    const allById = new Map<string, ChatMessageModel>()
    for (const existing of this.allMessages) {
      allById.set(existing.id, existing)
    }

    for (const m of nextBranchMessages) {
      allById.set(m.id, m)
    }

    const nextAllMessages: Array<ChatMessageModel> = []
    const seen = new Set<string>()
    for (const existing of this.allMessages) {
      const merged = allById.get(existing.id)
      if (!merged) continue
      nextAllMessages.push(merged)
      seen.add(merged.id)
    }
    for (const merged of allById.values()) {
      if (seen.has(merged.id)) continue
      nextAllMessages.push(merged)
    }

    const nextAllById = new Map<string, ChatMessageModel>()
    for (const m of nextAllMessages) {
      nextAllById.set(m.id, m)
    }
    for (const m of nextBranchMessages) {
      const parentId = m.parentMessageId
      if (!parentId) continue
      if (!parentId.trim()) continue
      const parent = nextAllById.get(parentId)
      if (!parent) continue
      if (!parent.childrenMessageIds.includes(m.id)) {
        parent.childrenMessageIds = [...parent.childrenMessageIds, m.id]
      }
    }

    this.allMessages = nextAllMessages
    const deduplicatedBranch = Array.from(
      new Map(nextBranchMessages.map((m) => [m.id, m])).values(),
    )
    this.messages = deduplicatedBranch
  }

  selectChildForParentMessage(parentMessageId: string, childMessageId: string) {
    if (!parentMessageId) return
    if (!parentMessageId.trim()) return
    if (!childMessageId) return

    this.selectedChildByParentId.set(parentMessageId, childMessageId)

    const parentIndex = this.messages.findIndex((m) => m.id === parentMessageId)
    if (parentIndex >= 0) {
      for (let i = parentIndex + 1; i < this.messages.length; i += 1) {
        const downstreamParentId = this.messages[i]?.id
        if (!downstreamParentId) continue
        this.selectedChildByParentId.delete(downstreamParentId)
      }
    }

    this.recomputeActiveBranchMessages()

    if (this.chatApi) {
      this.chatApi.setMessages(this.getActiveBranchUiMessagesWithParts())
    }
  }

  selectSiblingMessageVersion(messageId: string, direction: 'prev' | 'next') {
    const messageById = new Map<string, ChatMessageModel>()
    for (const m of this.allMessages) {
      messageById.set(m.id, m)
    }
    const message = messageById.get(messageId)
    const parentMessageId = message?.parentMessageId
    if (!parentMessageId || !parentMessageId.trim()) {
      this.selectRootMessageVersion(messageId, direction, messageById)
      return
    }

    const siblingIds = this.getChildMessageIds(parentMessageId, messageById)
    if (siblingIds.length <= 1) return

    const currentIndex = siblingIds.indexOf(messageId)
    const resolvedCurrentIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex =
      direction === 'prev'
        ? (resolvedCurrentIndex - 1 + siblingIds.length) % siblingIds.length
        : (resolvedCurrentIndex + 1) % siblingIds.length

    const nextSiblingId = siblingIds[nextIndex]
    if (!nextSiblingId) return

    this.selectChildForParentMessage(parentMessageId, nextSiblingId)
  }

  getSiblingInfo(messageId: string): { current: number; total: number } | null {
    const messageById = new Map<string, ChatMessageModel>()
    for (const m of this.allMessages) {
      messageById.set(m.id, m)
    }

    const message = messageById.get(messageId)
    const parentMessageId = message?.parentMessageId
    if (!parentMessageId || !parentMessageId.trim()) {
      const siblingIds = this.getChildMessageIds(ROOT_PARENT_KEY, messageById)
      if (siblingIds.length <= 1) return null
      const currentIndex = siblingIds.indexOf(messageId)
      const resolvedCurrentIndex = currentIndex >= 0 ? currentIndex : 0
      return { current: resolvedCurrentIndex + 1, total: siblingIds.length }
    }

    const siblingIds = this.getChildMessageIds(parentMessageId, messageById)
    if (siblingIds.length <= 1) return null

    const currentIndex = siblingIds.indexOf(messageId)
    const resolvedCurrentIndex = currentIndex >= 0 ? currentIndex : 0

    return { current: resolvedCurrentIndex + 1, total: siblingIds.length }
  }

  private selectRootMessageVersion(
    messageId: string,
    direction: 'prev' | 'next',
    messageById: Map<string, ChatMessageModel>,
  ) {
    const siblingIds = this.getChildMessageIds(ROOT_PARENT_KEY, messageById)
    if (siblingIds.length <= 1) return

    const currentIndex = siblingIds.indexOf(messageId)
    const resolvedCurrentIndex = currentIndex >= 0 ? currentIndex : 0
    const nextIndex =
      direction === 'prev'
        ? (resolvedCurrentIndex - 1 + siblingIds.length) % siblingIds.length
        : (resolvedCurrentIndex + 1) % siblingIds.length

    const nextSiblingId = siblingIds[nextIndex]
    if (!nextSiblingId) return

    this.selectedChildByParentId = new Map([[ROOT_PARENT_KEY, nextSiblingId]])
    this.recomputeActiveBranchMessages()

    if (this.chatApi) {
      this.chatApi.setMessages(this.getActiveBranchUiMessagesWithParts())
    }
  }

  setStreamingMessage(message: UIMessage | undefined) {
    if (!message) return
    const metadata = message.metadata as { errorMessage?: string } | undefined

    const lastMessageModel = this.messages.at(-1)

    if (message.role === 'assistant') {
      const previousUserMessage = this.messages
        .slice()
        .reverse()
        .find((m) => m.role === 'user' && m.model)

      if (previousUserMessage?.model) {
        const currentMetadata = message.metadata as Record<string, unknown>
        message.metadata = {
          ...currentMetadata,
          model: previousUserMessage.model,
        }
      }

      const existingIndex = this.messages.findIndex((m) => m.id === message.id)
      const existing =
        existingIndex >= 0 ? this.messages[existingIndex] : undefined

      if (existing && existing.role === 'assistant') {
        existing.setErrorMessage(metadata?.errorMessage)
        existing.updateStreamingContent(message)
        return
      }

      if (
        lastMessageModel &&
        lastMessageModel.role === 'assistant' &&
        lastMessageModel.id === message.id
      ) {
        lastMessageModel.setErrorMessage(metadata?.errorMessage)
        lastMessageModel.updateStreamingContent(message)
        return
      }

      if (existing) return

      this.messages.push(new ChatMessageModel(message))
      return
    }

    const messageExists = this.messages.some((m) => m.id === message.id)
    if (messageExists) return
    const userMessage = this.messages.at(-2)
    if (userMessage && userMessage.role === 'user' && userMessage.model) {
      message.metadata = {
        model: userMessage.model,
      }
    }
    this.messages.push(new ChatMessageModel(message))
  }

  setStreamingStatus(status: ChatStatus) {
    this.status = status
    if (status === 'streaming' || status === 'submitted') {
      this.isStreaming = true
    } else {
      this.isStreaming = false
    }
  }

  setIsNew(isNew: boolean) {
    this.isNew = isNew
  }
  setModel(model: string) {
    this.model = model
  }

  setPendingMessage(message: ChatMessageModel | null) {
    this.pendingMessage = message
  }
  clearPendingMessage() {
    this.pendingMessage = null
  }
  setShowFullHeight(showFullHeight: boolean) {
    this.showFullHeight = showFullHeight
  }
}
