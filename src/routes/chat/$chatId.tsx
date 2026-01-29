import { createFileRoute } from '@tanstack/react-router'
import ChatPreview from '@/pages/chat/chat-preview/ChatPreview'

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatRouteComponent,
})

function ChatRouteComponent() {
  return <ChatPreview />
}

