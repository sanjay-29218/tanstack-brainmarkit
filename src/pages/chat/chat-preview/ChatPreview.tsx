import { memo, useCallback, useRef, useLayoutEffect } from 'react'
import ChatComposer from '../shared/ChatComposer'
import ChatMessageWrapper from './ChatContainer'
import { useUIChat } from '@/providers/ChatProvider'
import { observer } from 'mobx-react-lite'
import { useMutation } from 'convex/react'
import { api } from '@/lib/convex-api'

const ChatPreview = observer(function ChatPreview() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession

  const updateThreadModel = useMutation(api.chats.updateThreadModel)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'instant') => {
    const el = scrollContainerRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const onSend = useCallback(() => {
    requestAnimationFrame(() => {
      scrollToBottom('instant')
    })
  }, [scrollToBottom])

  useLayoutEffect(() => {
    if (activeChatSession?.status === 'submitted') {
      scrollToBottom('instant')
    }
  }, [activeChatSession?.status, scrollToBottom])

  const onModelChange = useCallback(
    (model: string) => {
      activeChatSession?.setModel(model)
      if (activeChatSession?.id) {
        void updateThreadModel({
          threadId: activeChatSession.id,
          model,
        }).then((data) => {
          chatStore.activeChatSession?.setModel(data.model)
        })
      }
    },
    [activeChatSession, chatStore, updateThreadModel],
  )

  return (
    <div className="relative flex h-full flex-col justify-between p-4">
      <ChatMessageWrapper
        onScrollToBottom={scrollToBottom}
        scrollContainerRef={scrollContainerRef}
        activeChatSessionId={activeChatSession?.id}
        activeMessageCount={activeChatSession?.messages.length ?? 0}
      />
      <ChatComposer
        onSend={onSend}
        onModelChange={onModelChange}
        model={activeChatSession?.model}
      />
    </div>
  )
})

export default memo(ChatPreview)
