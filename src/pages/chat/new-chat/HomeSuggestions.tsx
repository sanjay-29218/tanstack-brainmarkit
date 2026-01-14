import { memo, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TooltipText } from '@/components/ui/tooltip'
import { generateId } from 'ai'
import type { UIMessage } from '@ai-sdk/react'
import { authClient } from '@/lib/auth-client'

type TabKey = 'create' | 'explore' | 'debug' | 'code'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'create', label: 'Create' },
  { key: 'explore', label: 'Explore' },
  { key: 'debug', label: 'Debug' },
  { key: 'code', label: 'Code' },
]

const QUESTIONS: Record<TabKey, string[]> = {
  create: [
    'Draft a product spec for a mobile notes app',
    'Generate a marketing plan for a SaaS launch',
    'Write a concise README for a Next.js project',
  ],
  explore: [
    'Explain vector databases in simple terms',
    'What’s the difference between RAG and fine-tuning?',
    'Summarize the latest on multimodal LLMs',
  ],
  debug: [
    'Why does my React memo not prevent re-renders?',
    "Fix a TypeScript error: type 'unknown' is not assignable",
    'Optimize slow Next.js server actions',
  ],
  code: [
    'Write a React hook for debouncing user input',
    'Generate a TypeScript utility type for deep partial',
    'Create a function to parse and validate JSON safely',
    'Implement a retry mechanism for failed API calls',
    'Write unit tests for a complex async function',
    'Refactor this code to use async/await instead of promises',
  ],
}

function emitPrefill(text: string) {
  window.dispatchEvent(new CustomEvent('chat-prefill', { detail: { text } }))
}

interface HomeSuggestionsProps {
  className?: string
  onToggle?: (visible: boolean) => void
  onPrefill?: (userMessage: UIMessage) => void
  visible?: boolean
}

function HomeSuggestions(props: HomeSuggestionsProps) {
  const [active, setActive] = useState<TabKey>('create')
  const [internalVisible, setInternalVisible] = useState(true)
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const isSignedIn = !!session && !isSessionLoading
  const handleToggle = props.onToggle

  useEffect(() => {
    const onTyping = () => {
      handleToggle?.(false)
      setInternalVisible(false)
    }
    const onHide = () => {
      handleToggle?.(false)
      setInternalVisible(false)
    }
    window.addEventListener('chat-started-typing', onTyping)
    window.addEventListener('home-suggestions-hide', onHide)
    return () => {
      window.removeEventListener('chat-started-typing', onTyping)
      window.removeEventListener('home-suggestions-hide', onHide)
    }
  }, [handleToggle])

  const items = useMemo(() => QUESTIONS[active], [active])

  return (
    <AnimatePresence>
      {(props.visible ?? internalVisible) ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
          className={props.className}
        >
          <div className="mx-auto w-full max-w-4xl">
            <h2 className="my-4 text-center text-3xl font-bold">
              How can I help you today?
            </h2>
            <div className="my-5 flex justify-center gap-5">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActive(t.key)}
                  className={`rounded-full border px-3 py-1 text-sm ${active === t.key ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <TooltipText
              disabled={!!isSignedIn}
              text="You need to be logged in to use this feature"
            >
              <ul className={cn('grid gap-2 md:grid-cols-2', !isSignedIn && 'pointer-events-none')}>
                {items.map((q, idx) => (
                  <motion.li
                    key={`${active}-${idx}`}
                    layout
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <button
                      onClick={() => {
                        emitPrefill(q)
                        props.onPrefill?.({
                          id: generateId(),
                          role: 'user',
                          parts: [{ type: 'text', text: q }],
                        })
                        setInternalVisible(false)
                      }}
                      className="hover:bg-accent w-full rounded-md border px-3 py-2 text-left text-sm"
                    >
                      {q}
                    </button>
                  </motion.li>
                ))}
              </ul>
            </TooltipText>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default memo(HomeSuggestions)

