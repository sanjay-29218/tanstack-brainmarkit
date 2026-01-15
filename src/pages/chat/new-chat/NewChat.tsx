import { useCallback, useEffect, useMemo, useState } from 'react'
import ChatComposer from '../shared/ChatComposer'
import { useUIChat } from '@/providers/ChatProvider'
import HomeSuggestions from './HomeSuggestions'
import ChatSession from '../shared/ChatSession'
import ChatMessageModel from '../chat-preview/chat-message/ChatMessageModel'
import type { UIMessage } from 'ai'
import { generateId } from 'ai'
import { getModelById } from '@/constants/model-registry'
import { createId } from '@/lib/id'
import { useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'
import { useNavigate } from '@tanstack/react-router'

export default function NewChat() {
  const { chatStore } = useUIChat()
  const [isHomeSuggestionsVisible, setIsHomeSuggestionsVisible] = useState(true)
  const navigate = useNavigate()

  const freeMessageInfo = useQuery(api.apiKeys.getFreeMessageInfo)
  const hasApiKeys = freeMessageInfo?.hasApiKeys ?? false

  const isModelAvailable = useCallback(
    (modelId: string): boolean => {
      if (hasApiKeys) {
        return true
      }
      const model = getModelById(modelId)
      return model?.isFree ?? false
    },
    [hasApiKeys],
  )

  const defaultModel = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'mistralai/devstral-2512:free'
    }

    const savedModel = window.localStorage.getItem('selectedModel')
    if (savedModel && isModelAvailable(savedModel)) {
      return savedModel
    }

    return 'mistralai/devstral-2512:free'
  }, [isModelAvailable])

  const [model, setModel] = useState<string | undefined>(defaultModel)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const savedModel = window.localStorage.getItem('selectedModel')
    if (savedModel && isModelAvailable(savedModel) && model !== savedModel) {
      setModel(savedModel)
    }
  }, [hasApiKeys, isModelAvailable, model])

  useEffect(() => {
    if (model && !isModelAvailable(model)) {
      setModel(defaultModel)
    }
  }, [model, defaultModel, isModelAvailable])

  const onSend = useCallback(
    (userMessage: UIMessage) => {
      setIsHomeSuggestionsVisible(false)
      const threadId = createId()
      const newSession = new ChatSession(
        threadId,
        [],
        'New Chat',
        model,
        undefined,
        true,
      )
      const newUserMessage = new ChatMessageModel({
        id: generateId(),
        role: 'user',
        parts: userMessage.parts,
      })
      newSession.setPendingMessage(newUserMessage)
      chatStore.addChatSession(newSession)
      chatStore.setActiveChatId(threadId)
      void navigate({
        to: '/chat/$chatId',
        params: { chatId: threadId },
        replace: true,
      })
    },
    [navigate, chatStore, model],
  )

  const onModelChange = useCallback((newModel: string) => {
    const resolved = getModelById(newModel)
    if (resolved) {
      setModel(newModel)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedModel', newModel)
      }
    }
  }, [])

  return (
    <div className="relative flex h-full flex-col justify-between p-4">
      {isHomeSuggestionsVisible ? (
        <HomeSuggestions
          className="flex flex-1 items-center justify-center"
          onToggle={setIsHomeSuggestionsVisible}
          onPrefill={onSend}
          visible={isHomeSuggestionsVisible}
        />
      ) : (
        <div className="flex flex-1 "></div>
      )}
      <ChatComposer
        onSend={onSend}
        onModelChange={onModelChange}
        model={model}
      />
    </div>
  )
}
