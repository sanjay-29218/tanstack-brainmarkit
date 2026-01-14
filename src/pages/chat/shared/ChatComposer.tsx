/**
 * This component lets user to compose a chat message
 */
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowUp, StopCircleIcon } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { TooltipText } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { useUIChat } from '@/providers/ChatProvider'
import { observer } from 'mobx-react-lite'
import FileUpload from './file-upload/FileUpload'
import { generateId, type UIMessage } from 'ai'
import FileUploadPreview from './FileUploadPreview'
import { useFileUpload } from '@/hooks/use-file-upload'
import { ModelSelector } from '@/components/model-selector'
import { authClient } from '@/lib/auth-client'

interface ChatComposerProps {
  onSend: (userMessage: UIMessage) => void
  onModelChange: (model: string) => void
  model?: string
}

const ChatComposer = observer(function ChatComposer(props: ChatComposerProps) {
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession
  const [inputMessage, setInputMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const isSignedIn = !!session && !isSessionLoading
  const {
    fileUploadModel,
    handleFileSelect,
    isUploading,
    hasFiles,
    clearFiles,
    getFileParts,
  } = useFileUpload()

  const sendCurrentMessage = useCallback(async () => {
    if (!isSignedIn) return
    const text = inputMessage.trim()
    if (!text && !hasFiles) return

    const parts: UIMessage['parts'] = []
    if (text) {
      parts.push({ type: 'text', text })
    }
    const fileParts = getFileParts()
    parts.push(...fileParts)
    const id = generateId()
    const userMessage: UIMessage = {
      id,
      role: 'user',
      parts: parts,
      metadata: {
        model: props.model,
      },
    }

    if (activeChatSession?.chatApi) {
      activeChatSession.chatApi.send(userMessage)
    } else {
      props.onSend(userMessage)
    }

    setInputMessage('')
    clearFiles()
  }, [
    isSignedIn,
    inputMessage,
    hasFiles,
    getFileParts,
    activeChatSession,
    props,
    clearFiles,
  ])

  return (
    <TooltipText disabled={!!isSignedIn} text="You need to be logged in to send messages">
      <div
        className={cn(
          'bg-background mx-auto flex h-fit w-full max-w-4xl resize-none flex-col items-center gap-2 rounded-md border border-gray-500/50 p-2',
          !isSignedIn && 'cursor-not-allowed',
        )}
      >
        {hasFiles && (
          <FileUploadPreview
            files={fileUploadModel.files}
            onRemove={(id) => fileUploadModel.removeFile(id)}
          />
        )}
        <Textarea
          placeholder="Ask anything..."
          className="resize-y ring-0 focus:ring-offset-0 focus-visible:ring-0"
          value={inputMessage}
          rows={3}
          ref={textareaRef}
          readOnly={!isSignedIn}
          disabled={!isSignedIn}
          onChange={(e) => {
            const val = e.target.value
            setInputMessage(val)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (isSignedIn) void sendCurrentMessage()
            }
          }}
        />
        <div
          className={cn(
            'flex w-full items-center justify-between gap-2',
            !isSignedIn && 'pointer-events-none',
          )}
        >
          <div className="flex items-center gap-2">
            <ModelSelector model={props.model} onModelChange={props.onModelChange} />
            <FileUpload
              onFileSelect={handleFileSelect}
              disabled={!isSignedIn || isUploading}
              maxFiles={3}
              currentFileCount={fileUploadModel.files.length}
            />
          </div>

          <MessageSendStopButton
            message={inputMessage}
            onSend={sendCurrentMessage}
            disabled={!isSignedIn || isUploading}
            isFileUploading={isUploading}
            hasFiles={hasFiles}
          />
        </div>
      </div>
    </TooltipText>
  )
})

export default ChatComposer

interface MessageSendButtonProps {
  message: string
  onSend: () => void
  disabled?: boolean
  isFileUploading?: boolean
  hasFiles?: boolean
}
const MessageSendStopButton = observer(function MessageSendStopButton(props: MessageSendButtonProps) {
  const { chatStore } = useUIChat()
  const activeChatSession = chatStore.activeChatSession

  const getTooltipText = () => {
    if (props.isFileUploading) {
      return 'File is uploading, please wait'
    }
    if (activeChatSession?.isStreaming) {
      return 'Stop'
    }
    return 'Send (Enter). New line: Shift+Enter'
  }

  const canSend = props.message.trim() || props.hasFiles

  return (
    <TooltipText text={getTooltipText()}>
      {activeChatSession?.isStreaming ? (
        <Button
          variant="outline"
          className="size-10 cursor-pointer rounded-full"
          onClick={() => activeChatSession?.chatApi?.stop()}
          disabled={props.disabled}
          aria-label="Stop"
        >
          <StopCircleIcon />
        </Button>
      ) : (
        <Button
          variant="outline"
          className="size-10 cursor-pointer rounded-full"
          onClick={() => props.onSend()}
          disabled={props.disabled || !canSend || props.isFileUploading}
          aria-label="Send (Enter). New line: Shift+Enter"
        >
          <ArrowUp />
        </Button>
      )}
    </TooltipText>
  )
})

