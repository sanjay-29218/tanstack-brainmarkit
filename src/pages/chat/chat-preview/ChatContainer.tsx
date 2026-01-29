import ChatMessageList from './ChatMessageList'
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowDown } from 'lucide-react'

interface ChatContainerProps {
  onScrollToBottom: () => void
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  activeChatSessionId?: string
  activeMessageCount: number
}

const ChatContainer = function ChatContainer(props: ChatContainerProps) {
  const [isAtBottom, setIsAtBottom] = useState(true)
  const lastSessionIdRef = useRef<string | undefined>(undefined)
  const didInitialScrollRef = useRef(false)
  const onScrollToBottomRef = useRef(props.onScrollToBottom)
  const shouldStickToBottomRef = useRef(true)
  const scrollRafRef = useRef<number | null>(null)

  useEffect(() => {
    onScrollToBottomRef.current = props.onScrollToBottom
  }, [props.onScrollToBottom])

  const handleScrollToBottom = useCallback(() => {
    shouldStickToBottomRef.current = true
    onScrollToBottomRef.current()
    setIsAtBottom(true)
  }, [])

  useLayoutEffect(() => {
    const el = props.scrollContainerRef.current
    if (!el) return
    if (!props.activeChatSessionId) return

    if (lastSessionIdRef.current !== props.activeChatSessionId) {
      lastSessionIdRef.current = props.activeChatSessionId
      didInitialScrollRef.current = false
      shouldStickToBottomRef.current = true
    }

    if (didInitialScrollRef.current) return
    if (props.activeMessageCount <= 0) return

    el.scrollTop = el.scrollHeight
    didInitialScrollRef.current = true
  }, [props.activeChatSessionId, props.activeMessageCount, props.scrollContainerRef])

  useLayoutEffect(() => {
    const el = props.scrollContainerRef.current
    if (!el) return
    const contentEl = el.querySelector('[data-chat-scroll-content]') as HTMLElement | null
    if (!contentEl) return
    const observer = new ResizeObserver(() => {
      const next = el.clientHeight + el.scrollTop >= el.scrollHeight
      setIsAtBottom((prev) => (prev === next ? prev : next))

      if (!shouldStickToBottomRef.current) return
      if (scrollRafRef.current != null) return

      scrollRafRef.current = window.requestAnimationFrame(() => {
        scrollRafRef.current = null
        onScrollToBottomRef.current()
      })
    })

    observer.observe(contentEl)
    return () => {
      if (scrollRafRef.current != null) {
        window.cancelAnimationFrame(scrollRafRef.current)
        scrollRafRef.current = null
      }
      observer.disconnect()
    }
  }, [props.scrollContainerRef, props.activeMessageCount])

  useLayoutEffect(() => {
    const el = props.scrollContainerRef.current
    if (!el) return
    const handler = () => {
      const next = el.clientHeight + el.scrollTop >= el.scrollHeight
      shouldStickToBottomRef.current = next
      setIsAtBottom((prev) => (prev === next ? prev : next))
    }
    el.addEventListener('scroll', handler)
    return () => el.removeEventListener('scroll', handler)
  }, [props.scrollContainerRef])

  return (
    <>
      <div ref={props.scrollContainerRef} className="relative flex-1 overflow-y-auto">
        <ChatMessageList />
      </div>
      <ScrollToBottomButton visible={!isAtBottom} onClick={handleScrollToBottom} />
    </>
  )
}

export default ChatContainer

const ScrollToBottomButton = memo(
  (props: { visible: boolean; onClick: () => void }) => {
    if (!props.visible) return null
    return (
      <div className="absolute bottom-44 left-1/2 z-10 -translate-x-1/2">
        <Button size="sm" variant="secondary" className="shadow" onClick={props.onClick}>
          <ArrowDown className="mr-1 h-4 w-4" />
          Scroll to bottom
        </Button>
      </div>
    )
  },
  (prev, next) => prev.visible === next.visible && prev.onClick === next.onClick,
)

