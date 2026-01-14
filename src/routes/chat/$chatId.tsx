import { createFileRoute } from '@tanstack/react-router'
import ChatPreview from '@/pages/chat/chat-preview/ChatPreview'

export const Route = createFileRoute('/chat/$chatId')({
  component: ChatRouteComponent,
})

function ChatRouteComponent() {
  const { chatId } = Route.useParams()
  return <ChatPreview key={chatId} />
}

