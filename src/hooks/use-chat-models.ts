import { useMemo } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'
import { MODEL_REGISTRY } from '@/constants/model-registry'

export const useChatModels = () => {
  const apiKeys = useQuery(api.apiKeys.list)

  const openRouterApiKey = useMemo(() => {
    return apiKeys?.find((k) => k.modelProviderId === 'openrouter')?.key
  }, [apiKeys])

  const availableModelIds = useMemo<Set<string>>(() => {
    const ids = new Set<string>()

    if (openRouterApiKey) {
      MODEL_REGISTRY.forEach((model) => {
        ids.add(model.id)
      })
    }

    return ids
  }, [openRouterApiKey])

  return {
    apiKeys,
    availableModelIds,
    isApiKeysPending: apiKeys === undefined,
    openRouterApiKey,
  }
}

