import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import {
  CopyIcon,
  RotateCcwIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import RetryModelPopover from './RetryModelPopover'
import type ChatMessageModel from './ChatMessageModel'
import type { StreamingContent } from '../../shared/ChatSession'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { Response } from '@/components/ai-elements/response'
import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning'
import { Button } from '@/components/ui/button'
import { useUIChat } from '@/providers/ChatProvider'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import AssistantMessageActionsModel from './AssistantMessageModel'
import { cn } from '@/lib/utils'

interface AssistantMessageProps {
  message: ChatMessageModel
  onRetryWithModel?: (modelId: string) => void
}

interface AssistantMessageContentProps {
  message: ChatMessageModel
  showInlineFallback: boolean
}

const AssistantMessageContent = observer(function AssistantMessageContent(
  props: AssistantMessageContentProps,
) {
  return (
    <>
      {(props.message.reasoningText || props.message.isReasoning) && (
        <Reasoning
          className="mb-2"
          defaultOpen={false}
          isStreaming={props.message.isReasoning}
        >
          <ReasoningTrigger />
          <ReasoningContent>{props.message.reasoningText}</ReasoningContent>
        </Reasoning>
      )}
      {props.showInlineFallback && (
        <Response className="w-full whitespace-pre-wrap rounded-md bg-red-500/10 p-2 text-red-500">
          {props.message.errorMessage ?? 'No response'}
        </Response>
      )}
      {props.message.segments.length > 0 && (
        <AssistantMarkdown segments={props.message.segments} />
      )}
    </>
  )
})

interface AssistantMessageActionsProps {
  message: ChatMessageModel
  siblingInfo: { current: number; total: number } | null | undefined
  showRetryPopover: boolean
  isCopied: boolean
  isChatStreaming: boolean
  onPreviousVersion: () => void
  onNextVersion: () => void
  onRetryWithModel?: (modelId: string) => void
  onCopy: () => void
  onRetryPopoverChange: (open: boolean) => void
}

const AssistantMessageActions = observer(function AssistantMessageActions(
  props: AssistantMessageActionsProps,
) {
  return (
    <div
      className={cn('mt-1 flex items-center gap-1 transition-opacity', {
        'opacity-100': props.showRetryPopover,
        'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100':
          !props.showRetryPopover,
      })}
    >
      {props.siblingInfo && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={props.onPreviousVersion}
            type="button"
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <span className="px-1 text-xs tabular-nums text-muted-foreground">
            {props.siblingInfo.current}/{props.siblingInfo.total}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={props.onNextVersion}
            type="button"
          >
            <ChevronRightIcon className="size-4" />
          </Button>
        </div>
      )}
      {!props.isChatStreaming && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={props.onCopy}
          type="button"
        >
          {props.isCopied ? (
            <CheckIcon className="size-4" />
          ) : (
            <CopyIcon className="size-4" />
          )}
        </Button>
      )}
      {!props.isChatStreaming && props.onRetryWithModel && (
        <RetryModelPopover
          open={props.showRetryPopover}
          onOpenChange={props.onRetryPopoverChange}
          currentModel={props.message.model}
          onSelectModel={props.onRetryWithModel}
        >
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              type="button"
            >
              <RotateCcwIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
        </RetryModelPopover>
      )}
      {!props.isChatStreaming && (
        <div className="text-xs text-muted-foreground">
          {props.message.model}
        </div>
      )}
    </div>
  )
})

export const AssistantMessage = observer(function AssistantMessage(
  props: AssistantMessageProps,
) {
  const { message } = props
  const [isCopied, setIsCopied] = useState(false)
  const [showRetryPopover, setShowRetryPopover] = useState(false)
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession
  const siblingInfo = activeChatSession?.getSiblingInfo(message.id)
  const isStreaming =
    activeChatSession?.isStreaming &&
    activeChatSession.messages.at(-1)?.id === message.id
  const isChatStreaming = activeChatSession?.isStreaming ?? false
  const showInlineFallback =
    !isStreaming &&
    !message.isReasoning &&
    !message.reasoningText &&
    message.segments.length === 0

  const assistantMessageActions = new AssistantMessageActionsModel(
    activeChatSession,
    message,
  )

  return (
    <div className="group">
      <Message from="assistant">
        <MessageContent variant="flat">
          <AssistantMessageContent
            message={message}
            showInlineFallback={showInlineFallback}
          />
        </MessageContent>
      </Message>
      {message.errorMessage && !showInlineFallback && (
        <div className="my-2 rounded-md w-full bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {message.errorMessage}
        </div>
      )}
      <AssistantMessageActions
        message={message}
        siblingInfo={siblingInfo}
        showRetryPopover={showRetryPopover}
        isCopied={isCopied}
        isChatStreaming={isChatStreaming}
        onPreviousVersion={() => {
          if (!activeChatSession) return
          activeChatSession.selectSiblingMessageVersion(message.id, 'prev')
        }}
        onNextVersion={() => {
          if (!activeChatSession) return
          activeChatSession.selectSiblingMessageVersion(message.id, 'next')
        }}
        onRetryWithModel={props.onRetryWithModel}
        onCopy={async () => {
          if (
            typeof window === 'undefined' ||
            !navigator?.clipboard?.writeText
          ) {
            return
          }

          try {
            await navigator.clipboard.writeText(
              assistantMessageActions.getFullText(),
            )
            setIsCopied(true)
            setTimeout(() => setIsCopied(false), 2000)
          } catch (error) {
            console.error('Failed to copy:', error)
          }
        }}
        onRetryPopoverChange={setShowRetryPopover}
      />
    </div>
  )
})

interface AssistantMarkdownProps {
  segments: StreamingContent[]
}

const AssistantMarkdown = observer(function AssistantMarkdown(
  props: AssistantMarkdownProps,
) {
  if (props.segments.length === 0) {
    return null
  }

  return (
    <div className="grid gap-3">
      {props.segments.map((seg, idx) =>
        seg.type === 'text' ? (
          <Response key={idx}>{seg.text ?? ''}</Response>
        ) : (
          <CodeBlock
            key={idx}
            code={seg.code ?? ''}
            language={((seg.lang as string) || 'text') as any}
          >
            <CodeBlockCopyButton />
          </CodeBlock>
        ),
      )}
    </div>
  )
})
