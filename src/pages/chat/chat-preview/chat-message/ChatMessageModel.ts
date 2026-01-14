import type { FileUIPart, UIMessage } from 'ai'
import { observable, action, makeObservable } from 'mobx'
import type { StreamingContent } from '../../shared/ChatSession'

type ReasoningPart = Extract<UIMessage['parts'][number], { type: 'reasoning' }>

// Start fence: matches ```lang\n (also matches incomplete fence line at EOF)
const START_FENCE_REGEX = /(^|\n)```([\w+\-.]*)\s*(\n|$)/
// End fence: matches ```\n or ```$ (must be at start of a line)
const END_FENCE_REGEX = /(^|\n)```\s*(\n|$)/

class ChatMessageModel {
  id: string = ''
  text: string = ''
  role: UIMessage['role'] = 'user'
  files: FileUIPart[] = []
  uiMessage: UIMessage
  isReasoning: boolean = false
  reasoningText: string = ''
  reasoningParts: ReasoningPart[] = []
  segments: StreamingContent[] = []
  errorMessage?: string
  model?: string
  parentMessageId?: string
  childrenMessageIds: string[] = []

  constructor(message: UIMessage) {
    this.uiMessage = message
    makeObservable(this, {
      uiMessage: observable,
      id: observable,
      text: observable,
      role: observable,
      isReasoning: observable,
      reasoningText: observable,
      reasoningParts: observable,
      updateStreamingContent: action,
      init: action,
      files: observable,
      segments: observable,
      parseReasoningParts: action,
      parseStreamingContent: action,
      errorMessage: observable,
      setErrorMessage: action,
      model: observable,
      parentMessageId: observable,
      childrenMessageIds: observable,
    })
    this.init(message)
  }

  init(message: UIMessage) {
    this.id = message.id
    this.text = message.parts
      .map((part) => (part.type === 'text' ? part.text : ''))
      .filter((part) => part !== '')
      .join('\n\n')
      .trimStart()
    this.role = message.role
    this.parseReasoningParts(message)
    this.files = message.parts
      .filter((part): part is FileUIPart => part.type === 'file')
      .map((part) => ({
        type: 'file',
        mediaType: part.mediaType,
        url: part.url,
        filename: part.filename,
      }))
    const metadata = message.metadata as
      | {
          errorMessage?: string
          model?: string
          parentMessageId?: string
          childrenMessageIds?: string[]
        }
      | undefined
    this.errorMessage = metadata?.errorMessage
    this.model = metadata?.model
    this.parentMessageId = metadata?.parentMessageId
    this.childrenMessageIds = metadata?.childrenMessageIds ?? []

    if (this.role === 'assistant' && this.text) {
      this.parseStreamingContent()
    }
  }

  setErrorMessage(errorMessage: string | undefined) {
    if (!errorMessage) return
    this.errorMessage = errorMessage
  }

  updateStreamingContent(message: UIMessage) {
    const previousMetadata =
      (this.uiMessage.metadata as Record<string, unknown> | undefined) ?? {}
    const nextMetadata =
      (message.metadata as Record<string, unknown> | undefined) ?? {}
    const mergedMetadata = { ...previousMetadata, ...nextMetadata }
    this.uiMessage = {
      ...message,
      metadata: mergedMetadata,
    }

    const metadata = mergedMetadata as
      | {
          errorMessage?: string
          model?: string
          parentMessageId?: string
          childrenMessageIds?: string[]
        }
      | undefined
    if (metadata?.model) {
      this.model = metadata.model
    }

    this.parseReasoningParts(message)
    this.text = message.parts
      .map((part) => (part.type === 'text' ? part.text : ''))
      .filter((part) => part !== '')
      .join('\n\n')
      .trimStart()

    const lastSegmentIndex = this.segments.length - 1
    const lastSegment = lastSegmentIndex >= 0 ? this.segments[lastSegmentIndex] : undefined
    if (lastSegment && (lastSegment.start == null || lastSegment.end == null)) {
      this.segments = []
    }
    this.parseStreamingContent()
  }

  parseReasoningParts(message: UIMessage) {
    this.reasoningParts = message.parts.filter(
      (part): part is ReasoningPart => part.type === 'reasoning',
    ) as ReasoningPart[]
    this.reasoningText = this.reasoningParts.map((part) => part.text).join('\n\n')

    const hasError = !!(message.metadata as { errorMessage?: string } | undefined)?.errorMessage

    this.isReasoning =
      !hasError &&
      this.reasoningParts.some((part) => part.state === 'streaming') &&
      !this.reasoningParts.some((part) => part.state === 'done')
  }

  parseStreamingContent() {
    const content = this.text
    while (true) {
      const lastSegmentIndex = this.segments.length - 1
      const lastSegment = lastSegmentIndex >= 0 ? this.segments[lastSegmentIndex] : undefined
      const currentEnd = lastSegment?.end ?? 0
      if (currentEnd >= content.length) return

      const chunk = content.slice(currentEnd)

      if (lastSegment?.type === 'code' && !lastSegment.isCodeCompleted) {
        const match = END_FENCE_REGEX.exec(chunk)
        if (match && match.index !== undefined) {
          const prefixLen = match[1]?.length ?? 0
          const fenceStart = match.index + prefixLen
          const fenceLen = match[0].length - prefixLen

          const codePart = chunk.slice(0, fenceStart)
          this.segments[lastSegmentIndex] = {
            ...lastSegment,
            code: (lastSegment.code ?? '') + codePart,
            end: currentEnd + codePart.length + fenceLen,
            isCodeCompleted: true,
          }
          continue
        }

        this.segments[lastSegmentIndex] = {
          ...lastSegment,
          code: (lastSegment.code ?? '') + chunk,
          end: currentEnd + chunk.length,
        }
        return
      }

      const match = START_FENCE_REGEX.exec(chunk)
      if (match && match.index !== undefined) {
        const prefixLen = match[1]?.length ?? 0
        const fenceStart = match.index + prefixLen
        const fenceLen = match[0].length - prefixLen

        const textPart = chunk.slice(0, fenceStart)
        if (textPart) {
          if (lastSegment && lastSegment.type === 'text') {
            this.segments[lastSegmentIndex] = {
              ...lastSegment,
              text: (lastSegment.text ?? '') + textPart,
              end: currentEnd + textPart.length,
            }
          } else {
            this.segments.push({
              type: 'text',
              text: textPart,
              start: currentEnd,
              end: currentEnd + textPart.length,
              id: `text:${currentEnd}`,
            })
          }
        }

        const lang = match[2]
        const start = currentEnd + textPart.length
        this.segments.push({
          type: 'code',
          code: '',
          lang,
          start,
          end: start + fenceLen,
          id: `code:${start}`,
          isCodeCompleted: false,
        })
        continue
      }

      if (lastSegment && lastSegment.type === 'text') {
        this.segments[lastSegmentIndex] = {
          ...lastSegment,
          text: (lastSegment.text ?? '') + chunk,
          end: currentEnd + chunk.length,
        }
        return
      }

      this.segments.push({
        type: 'text',
        text: chunk,
        start: currentEnd,
        end: currentEnd + chunk.length,
        id: `text:${currentEnd}`,
      })
      return
    }
  }
}

export default ChatMessageModel

