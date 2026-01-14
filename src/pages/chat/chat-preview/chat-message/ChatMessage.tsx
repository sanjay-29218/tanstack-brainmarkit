import ChatMessageModel from './ChatMessageModel'
import { UserMessage } from './UserMessage'
import { AssistantMessage } from './AssistantMessage'
import { observer } from 'mobx-react-lite'
import { memo } from 'react'
import { useUIChat } from '@/providers/ChatProvider'
import { toJS } from 'mobx'
import type { UIMessage } from 'ai'

interface ChatMessageProps {
  message: ChatMessageModel
}

const ChatMessage = observer(function ChatMessage(props: ChatMessageProps) {
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession
  const message = props.message
  const isUser = message.role === 'user'

  const handleRetry = () => {
    if (!activeChatSession?.chatApi) return

    const messageIndex = activeChatSession.messages.findIndex((m) => m.id === message.id)
    if (messageIndex === -1) return

    const parentMessageId = message.parentMessageId
    if (!parentMessageId) return

    const parentIndex = activeChatSession.messages.findIndex((m) => m.id === parentMessageId)
    if (parentIndex === -1) return

    const messagesToKeep = activeChatSession.messages.slice(0, parentIndex + 1)
    const lastMessageToResend = messagesToKeep.at(-1)
    if (!lastMessageToResend) return

    const uiMessagesToKeep = activeChatSession.getUiMessagesWithParts(messagesToKeep)
    activeChatSession.setMessages(uiMessagesToKeep)
    activeChatSession.chatApi.setMessages(uiMessagesToKeep)

    activeChatSession.setShouldRefetchAfterFinish(true)
    activeChatSession.chatApi.send(toJS(lastMessageToResend.uiMessage) as UIMessage)
  }

  const handleRetryWithModel = (selectedModel: string) => {
    if (!activeChatSession?.chatApi) return
    if (!selectedModel) return
    activeChatSession.setModel(selectedModel)
    handleRetry()
  }

  if (isUser) {
    return <UserMessage message={message} onRetryWithModel={handleRetryWithModel} />
  }

  return <AssistantMessage message={message} onRetryWithModel={handleRetryWithModel} />
})

export default memo(ChatMessage)

