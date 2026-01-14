import { useState, useMemo, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import {
  RotateCcwIcon,
  EyeIcon,
  BrainIcon,
  SparklesIcon,
  ChevronDownIcon,
  ArchiveIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getModelById, type RegisteredModel, MODEL_REGISTRY } from '@/constants/model-registry'
import ProviderIcon from '@/components/model-selector/ProviderIcon'
import { useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'

interface RetryModelPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentModel?: string
  onSelectModel: (modelId: string) => void
  children: React.ReactNode
}

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  google: 'Gemini',
  anthropic: 'Claude',
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  meta: 'Llama',
  xai: 'Grok',
  other: 'Other',
}

const RetryModelPopover = observer(function RetryModelPopover(props: RetryModelPopoverProps) {
  const [showLegacy, setShowLegacy] = useState<Record<string, boolean>>({})

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

  const providers = useMemo(() => {
    const providerSet = new Set<string>()
    MODEL_REGISTRY.forEach((model) => {
      if (model.isPopular || isModelAvailable(model.id)) {
        providerSet.add(model.provider)
      }
    })
    return Array.from(providerSet)
  }, [isModelAvailable])

  const getModelsByProvider = useCallback(
    (provider: string) => {
      const models = MODEL_REGISTRY.filter(
        (m) => m.provider === provider && (m.isPopular || isModelAvailable(m.id)),
      )
      const popular = models.filter((m) => m.isPopular)
      const others = models.filter((m) => !m.isPopular)
      return { popular, others }
    },
    [isModelAvailable],
  )

  const handleSelectModel = (modelId: string) => {
    props.onSelectModel(modelId)
    props.onOpenChange(false)
  }

  const handleRetrySame = () => {
    if (props.currentModel) {
      props.onSelectModel(props.currentModel)
    }
    props.onOpenChange(false)
  }

  const toggleLegacy = (provider: string) => {
    setShowLegacy((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  return (
    <DropdownMenu open={props.open} onOpenChange={props.onOpenChange}>
      {props.children}
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuItem onClick={handleRetrySame}>
          <RotateCcwIcon className="size-4" />
          <span>Retry same</span>
        </DropdownMenuItem>

        <div className="relative my-2 px-2">
          <div className="absolute inset-0 flex items-center px-2">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-popover px-2 text-muted-foreground">or switch model</span>
          </div>
        </div>

        {providers.map((provider) => {
          const modelsByProvider = getModelsByProvider(provider)
          const hasLegacy = modelsByProvider.others && modelsByProvider.others.length > 0

          return (
            <DropdownMenuSub key={provider}>
              <DropdownMenuSubTrigger>
                <ProviderIcon
                  provider={provider as RegisteredModel['provider']}
                  size={16}
                  className="text-muted-foreground"
                />
                <span className="ml-2">{PROVIDER_DISPLAY_NAMES[provider] || provider}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64">
                {modelsByProvider.popular.map((model) => (
                  <ModelMenuItem
                    key={model.id}
                    model={model}
                    isAvailable={isModelAvailable(model.id)}
                    isCurrent={props.currentModel === model.id}
                    onSelect={() => handleSelectModel(model.id)}
                  />
                ))}

                {hasLegacy && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault()
                        toggleLegacy(provider)
                      }}
                      className="text-muted-foreground"
                    >
                      <ArchiveIcon className="size-4" />
                      <span>Show legacy models</span>
                      <ChevronDownIcon
                        className={cn(
                          'ml-auto size-4 transition-transform',
                          showLegacy[provider] && 'rotate-180',
                        )}
                      />
                    </DropdownMenuItem>
                    {showLegacy[provider] &&
                      modelsByProvider.others.map((model) => (
                        <ModelMenuItem
                          key={model.id}
                          model={model}
                          isAvailable={isModelAvailable(model.id)}
                          isCurrent={props.currentModel === model.id}
                          onSelect={() => handleSelectModel(model.id)}
                        />
                      ))}
                  </>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

interface ModelMenuItemProps {
  model: RegisteredModel
  isAvailable: boolean
  isCurrent: boolean
  onSelect: () => void
}

const ModelMenuItem = observer(function ModelMenuItem(props: ModelMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={props.onSelect}
      disabled={!props.isAvailable}
      className={cn(
        'flex items-center justify-between',
        props.isCurrent && 'bg-accent',
        !props.isAvailable && 'cursor-not-allowed opacity-50',
      )}
    >
      <div className="flex items-center gap-2">
        <SparklesIcon className="size-3.5 text-muted-foreground" />
        <span>
          {props.model.name} {props.model.subtitle}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {props.model.capabilities.vision && (
          <div className="flex size-5 items-center justify-center rounded bg-emerald-500/10">
            <EyeIcon className="size-3 text-emerald-600" />
          </div>
        )}
        {props.model.capabilities.reasoning && (
          <div className="flex size-5 items-center justify-center rounded bg-purple-500/10">
            <BrainIcon className="size-3 text-purple-600" />
          </div>
        )}
      </div>
    </DropdownMenuItem>
  )
})

export default RetryModelPopover

