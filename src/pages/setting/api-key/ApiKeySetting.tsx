import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ProviderDropdown } from './ProviderDropdown'
import { ApiKeySettingModel } from './ApiKeySettingModel'
import { ALL_PROVIDERS } from '@/constants/api-providers'
import ProviderApiKeyInput from './ProviderApiKeyInput'
import { toast } from 'sonner'
import { MISTRAL_DEVSTRAL_2_2512 } from '@/constants/model-registry'
import { useMutation, useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'

const ApiKeySettingComponent = observer(function ApiKeySettingComponent() {
  const [model] = useState(() => new ApiKeySettingModel())

  const apiKeys = useQuery(api.apiKeys.list)
  const isPending = apiKeys === undefined

  const [savingKeyId, setSavingKeyId] = useState<string | null>(null)
  const createApiKey = useMutation(api.apiKeys.create)
  const updateApiKey = useMutation(api.apiKeys.update)

  const [deletingKeyId, setDeletingKeyId] = useState<string | null>(null)
  const deleteApiKey = useMutation(api.apiKeys.deleteKey)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!apiKeys) return
    model.init(apiKeys)
  }, [apiKeys, model])

  const isMaskedKey = (key: string | null | undefined): boolean => {
    if (!key) return false
    return key.includes('*') && key.length > 8
  }

  const handleSaveApiKey = async (providerId: string) => {
    const apiKey = model.apiKeys.find((k) => k.modelProviderId === providerId)
    if (!apiKey?.key) return

    if (isMaskedKey(apiKey.key)) return

    setSavingKeyId(providerId)

    try {
      if (apiKey.id && apiKey.key.trim().length > 0) {
        await updateApiKey({ id: apiKey.id, key: apiKey.key })
        toast.success('API key updated successfully')
        return
      }

      await createApiKey({
        providerId: apiKey.modelProviderId,
        key: apiKey.key || '',
        providerName: apiKey.modelProviderId,
      })
      toast.success('API key created successfully')
    } catch (error) {
      console.error(error)
      toast.error('Failed to save API key')
    } finally {
      setSavingKeyId(null)
    }
  }

  const handleDeleteApiKey = async (providerId: string) => {
    const apiKey = model.apiKeys.find((k) => k.modelProviderId === providerId)
    if (!apiKey) return

    const resetSelectedModel = () => {
      localStorage.removeItem('selectedModel')
      localStorage.setItem('selectedModel', MISTRAL_DEVSTRAL_2_2512.id)
    }

    if (!apiKey.id) {
      model.removeProvider(providerId)
      resetSelectedModel()
      return
    }

    setDeletingKeyId(providerId)
    try {
      setIsDeleting(true)
      await deleteApiKey({ id: apiKey.id })
      model.removeProvider(providerId)
      resetSelectedModel()
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete API key')
    } finally {
      setDeletingKeyId(null)
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model providers</CardTitle>
        <CardDescription>
          Add provider API keys. We will use these to call their models.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProviderDropdown
          availableProviders={ALL_PROVIDERS.filter(
            (p) => !model.apiKeys.some((k) => k.modelProviderId === p.id),
          )}
          onSelectProvider={(id) => model.addProvider(id)}
          isLoading={isPending}
        />

        {isPending ? (
          <ApiKeyLoadingSkeleton />
        ) : (
          <>
            {model.apiKeys.length === 0 ? (
              <div className="text-muted-foreground text-sm">
                No API key added. Use &quot;Add provider&quot; to add one.
              </div>
            ) : null}

            <div className="grid gap-5">
              {model.apiKeys.map((apiKey) => {
                const provider = ALL_PROVIDERS.find(
                  (p) => p.id === apiKey.modelProviderId,
                )
                if (!provider) return null

                const isSaving = savingKeyId === apiKey.modelProviderId

                return (
                  <ProviderApiKeyInput
                    apiKey={apiKey}
                    key={apiKey.id ?? apiKey.modelProviderId}
                    onValueChange={(newValue) =>
                      model.updateApiKeyValue(apiKey.modelProviderId, newValue)
                    }
                    onBlur={() => void handleSaveApiKey(apiKey.modelProviderId)}
                    onDelete={() =>
                      void handleDeleteApiKey(apiKey.modelProviderId)
                    }
                    isDeleting={
                      deletingKeyId === apiKey.modelProviderId && isDeleting
                    }
                    isSaving={isSaving}
                  />
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
})

export default ApiKeySettingComponent

function ApiKeyLoadingSkeleton() {
  return (
    <div className="grid gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      ))}
    </div>
  )
}
