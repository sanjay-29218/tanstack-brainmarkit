import { memo } from 'react'
import { useUIChat } from '@/providers/ChatProvider'
import { observer } from 'mobx-react-lite'
import ChatMessage from './chat-message/ChatMessage'

const ChatMessageList = observer(function ChatMessageList() {
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession
  const messages = activeChatSession?.messages
  const lastMessage = messages?.at(-1)
  const isWaitingForFirstAssistantContent =
    !!activeChatSession?.isStreaming &&
    (!lastMessage ||
      lastMessage.role !== 'assistant' ||
      (!lastMessage.isReasoning &&
        !lastMessage.reasoningText &&
        lastMessage.segments.length === 0))
  return (
    <div className="mx-auto max-w-4xl" data-chat-scroll-content>
      <div className="relative py-6">
        <div className="flex flex-col gap-2">
          {messages?.map((m) => (
            <ChatMessage key={m.uiMessage.id} message={m} />
          ))}
        </div>
        <TypingIndicator show={isWaitingForFirstAssistantContent} />
        <FullHeight showFullHeight={activeChatSession?.showFullHeight ?? false} />
      </div>
    </div>
  )
})

const FullHeight = ({ showFullHeight }: { showFullHeight: boolean }) => {
  if (!showFullHeight) return null
  return <div className="h-[calc(100vh-300px)]" />
}

interface TypingIndicatorProps {
  show: boolean
}

const TypingIndicator = (props: TypingIndicatorProps) => {
  if (!props.show) return null
  return (
    <div className="flex items-center gap-1 py-1">
      <span
        className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
        style={{ animationDelay: '0ms' }}
      />
      <span
        className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
        style={{ animationDelay: '150ms' }}
      />
      <span
        className="bg-muted-foreground h-2 w-2 animate-bounce rounded-full"
        style={{ animationDelay: '300ms' }}
      />
      <span className="sr-only">Assistant is typing</span>
    </div>
  )
}

export default memo(ChatMessageList)

