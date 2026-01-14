import { useCallback, useEffect, useRef } from 'react'
import type { ChatStatus, UIMessage } from 'ai'

interface UseRafBufferProps {
  messages: UIMessage[]
  status: ChatStatus
  onUpdate: (messages: UIMessage[], status: ChatStatus) => void
  isActive: boolean
}

export const useRafBuffer = (props: UseRafBufferProps) => {
  const bufferRef = useRef<{
    messages: UIMessage[]
    status: ChatStatus
  } | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const statusRef = useRef<ChatStatus>(props.status)
  const onUpdateRef = useRef(props.onUpdate)

  useEffect(() => {
    if (!props.isActive) return
    statusRef.current = props.status
    onUpdateRef.current = props.onUpdate
  }, [props.status, props.onUpdate, props.isActive])

  const startRafLoop = useCallback(() => {
    if (rafIdRef.current != null) return

    const loop = () => {
      const buffer = bufferRef.current

      if (buffer) {
        onUpdateRef.current(buffer.messages, buffer.status)
        bufferRef.current = null
      }

      if (statusRef.current !== 'streaming') {
        rafIdRef.current = null
        return
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  const stopRafLoop = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
  }, [])

  const flushBuffer = useCallback(() => {
    const buffer = bufferRef.current
    if (buffer) {
      onUpdateRef.current(buffer.messages, buffer.status)
      bufferRef.current = null
    }
  }, [])

  useEffect(() => {
    bufferRef.current = {
      messages: props.messages,
      status: props.status,
    }

    if (props.status === 'streaming' || props.status === 'submitted') {
      startRafLoop()
    } else {
      flushBuffer()
      stopRafLoop()
    }

    return () => {
      if (props.status !== 'streaming') {
        flushBuffer()
        stopRafLoop()
      }
    }
  }, [props.messages, props.status, startRafLoop, stopRafLoop, flushBuffer])
}

