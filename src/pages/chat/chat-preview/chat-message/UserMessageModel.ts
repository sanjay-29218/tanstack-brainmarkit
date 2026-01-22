import { action, makeObservable, observable, toJS } from 'mobx'
import { generateId, type UIMessage } from 'ai'
import type ChatMessageModel from './ChatMessageModel'
import ChatSession from '../../shared/ChatSession'

class UserMessageActionsModel {
  activeChatSession: ChatSession | null | undefined
  message: ChatMessageModel

  constructor(activeChatSession: ChatSession | null | undefined, message: ChatMessageModel) {
    this.activeChatSession = activeChatSession
    this.message = message
    makeObservable(this, {
      activeChatSession: observable,
      message: observable,
      saveEdit: action,
      retryWithModel: action,
    })
  }

  saveEdit(editText: string) {
    if (!this.activeChatSession?.chatApi) return

    const messageIndex = this.activeChatSession.messages.findIndex((m) => m.id === this.message.id)
    if (messageIndex === -1) return

    const editedMessage: UIMessage = {
      ...toJS(this.message.uiMessage),
      id: generateId(),
      parts: [{ type: 'text', text: editText }],
    }

    const messagesToKeep = this.activeChatSession.messages.slice(0, messageIndex)
    const uiMessagesToKeep = this.activeChatSession.getUiMessagesWithParts(messagesToKeep)
    this.activeChatSession.setMessages(uiMessagesToKeep)
    this.activeChatSession.chatApi.setMessages(uiMessagesToKeep)
    this.activeChatSession.chatApi.send(editedMessage)
  }

  retryWithModel(selectedModel: string) {
    if (!this.activeChatSession?.chatApi) return

    const messageIndex = this.activeChatSession.messages.findIndex((m) => m.id === this.message.id)
    if (messageIndex === -1) return

    const messagesToKeep = this.activeChatSession.messages.slice(0, messageIndex)
    const uiMessagesToKeep = this.activeChatSession.getUiMessagesWithParts(messagesToKeep)
    this.activeChatSession.setMessages(uiMessagesToKeep)
    this.activeChatSession.chatApi.setMessages(uiMessagesToKeep)

    this.activeChatSession.setModel(selectedModel)
    this.activeChatSession.chatApi.send(toJS(this.message.uiMessage) as UIMessage)
  }
}

export default UserMessageActionsModel

