import { useState, useRef, useEffect } from 'react'
import { Message, MessageContent } from '@/components/ai-elements/message'
import { FilePreviewList } from '../../shared/file-preview/FilePreview'
import { Button } from '@/components/ui/button'
import {
  CopyIcon,
  RotateCcwIcon,
  CheckIcon,
  PencilIcon,
  SendIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import RetryModelPopover from './RetryModelPopover'
import { DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { useUIChat } from '@/providers/ChatProvider'
import { observer } from 'mobx-react-lite'
import type ChatMessageModel from './ChatMessageModel'
import UserMessageActionsModel from './UserMessageModel'

interface UserMessageProps {
  message: ChatMessageModel
  onRetryWithModel?: (modelId: string) => void
}

interface UserMessageEditFormProps {
  editText: string
  onEditTextChange: (text: string) => void
  onSave: () => void
  onCancel: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
}

export const UserMessage = observer(function UserMessage(props: UserMessageProps) {
  const { message } = props
  const [isCopied, setIsCopied] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const [showRetryPopover, setShowRetryPopover] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession
  const siblingInfo = activeChatSession?.getSiblingInfo(message.id)

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      )
    }
  }, [isEditing])

  const handleCopy = async () => {
    if (typeof window === 'undefined' || !navigator?.clipboard?.writeText) {
      return
    }

    try {
      await navigator.clipboard.writeText(message.text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const userMessageActions = new UserMessageActionsModel(activeChatSession, message)

  return (
    <div className="group">
      <Message from="user" className="py-2">
        <MessageContent variant="contained" className="py-2">
          {isEditing ? (
            <UserMessageEditForm
              editText={editText}
              onEditTextChange={setEditText}
              onSave={() => {
                if (!activeChatSession?.chatApi) return
                userMessageActions.saveEdit(editText)
                setIsEditing(false)
              }}
              onCancel={() => {
                setIsEditing(false)
                setEditText(message.text)
              }}
              textareaRef={textareaRef}
            />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-normal">
              {message.text?.length > 0 ? message.text : 'No text'}
            </div>
          )}
        </MessageContent>
      </Message>
      {message.files.length > 0 && (
        <div className="shrink-0">
          <FilePreviewList
            files={message.files.map((file) => ({
              url: file.url,
              alt: file.filename || 'Uploaded file',
              mediaType: file.mediaType,
              filename: file.filename,
            }))}
            className="mt-0"
          />
        </div>
      )}
      {message.errorMessage && (
        <div className="mt-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {message.errorMessage}
        </div>
      )}
      {!isEditing && (
        <UserMessageActions
          message={message}
          siblingInfo={siblingInfo}
          showRetryPopover={showRetryPopover}
          isCopied={isCopied}
          onPreviousVersion={() => {
            if (!activeChatSession) return
            activeChatSession.selectSiblingMessageVersion(message.id, 'prev')
          }}
          onNextVersion={() => {
            if (!activeChatSession) return
            activeChatSession.selectSiblingMessageVersion(message.id, 'next')
          }}
          onRetryWithModel={(selectedModel: string) => {
            userMessageActions.retryWithModel(selectedModel)
          }}
          onEdit={() => {
            setEditText(message.text)
            setIsEditing(true)
          }}
          onCopy={handleCopy}
          onRetryPopoverChange={setShowRetryPopover}
        />
      )}
    </div>
  )
})

const UserMessageEditForm = observer(function UserMessageEditForm(props: UserMessageEditFormProps) {
  return (
    <div className={cn('animate-in slide-in-from-left-2 fade-in-0 duration-300')}>
      <Textarea
        ref={props.textareaRef}
        value={props.editText}
        onChange={(e) => props.onEditTextChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            props.onSave()
          }
          if (e.key === 'Escape') {
            props.onCancel()
          }
        }}
        className="min-h-[60px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0"
        rows={Math.max(2, props.editText.split('\n').length)}
      />
      <div className="mt-2 flex items-center gap-2">
        <Button
          size="sm"
          variant="default"
          onClick={props.onSave}
          disabled={!props.editText.trim()}
          className="gap-1"
        >
          <SendIcon className="size-3" />
          Send
        </Button>
        <Button size="sm" variant="ghost" onClick={props.onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
})

interface UserMessageActionsProps {
  message: ChatMessageModel
  siblingInfo: { current: number; total: number } | null | undefined
  showRetryPopover: boolean
  isCopied: boolean
  onPreviousVersion: () => void
  onNextVersion: () => void
  onRetryWithModel: (modelId: string) => void
  onEdit: () => void
  onCopy: () => void
  onRetryPopoverChange: (open: boolean) => void
}

const UserMessageActions = observer(function UserMessageActions(props: UserMessageActionsProps) {
  return (
    <div
      className={cn('mt-1 flex items-center justify-end gap-1 transition-opacity', {
        'opacity-100': props.showRetryPopover,
        'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100': !props.showRetryPopover,
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
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={props.onEdit}
        type="button"
      >
        <PencilIcon className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-foreground"
        onClick={props.onCopy}
        type="button"
      >
        {props.isCopied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </Button>
    </div>
  )
})

