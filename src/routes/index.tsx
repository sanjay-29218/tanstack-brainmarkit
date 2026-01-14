import { createFileRoute } from '@tanstack/react-router'
import NewChat from '@/pages/chat/new-chat/NewChat'

export const Route = createFileRoute('/')({
  component: NewChat,
})
