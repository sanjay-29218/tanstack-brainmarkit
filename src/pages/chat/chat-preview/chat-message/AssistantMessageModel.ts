import { makeObservable, observable } from 'mobx'
import type ChatMessageModel from './ChatMessageModel'
import type ChatSession from '../../shared/ChatSession'

class AssistantMessageActionsModel {
  activeChatSession: ChatSession | null | undefined
  message: ChatMessageModel

  constructor(
    activeChatSession: ChatSession | null | undefined,
    message: ChatMessageModel,
  ) {
    this.activeChatSession = activeChatSession
    this.message = message
    makeObservable(this, {
      activeChatSession: observable,
      message: observable,
    })
  }

  getFullText(): string {
    const parts: Array<string> = []

    if (this.message.reasoningText) {
      parts.push(this.message.reasoningText)
    }

    const segmentText = this.message.segments
      .map((seg) => {
        if (seg.type === 'text') {
          return seg.text
        } else if (seg.type === 'code') {
          return `\`\`\`${seg.lang || ''}\n${seg.code}\n\`\`\``
        }
        return ''
      })
      .join('\n\n')

    if (segmentText) {
      parts.push(segmentText)
    }

    return parts.join('\n\n')
  }
}

export default AssistantMessageActionsModel
