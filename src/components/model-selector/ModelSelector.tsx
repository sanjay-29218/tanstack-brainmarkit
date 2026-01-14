import { useState, useMemo, useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  Search,
  Filter,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  POPULAR_MODELS,
  OTHER_MODELS,
  getModelById,
  type RegisteredModel,
} from '@/constants/model-registry'
import ModelCard from './ModelCard'
import ProviderIcon from './ProviderIcon'
import CapabilityIcons from './CapabilityIcons'
import { useQuery } from 'convex/react'
import { api } from '@/lib/convex-api'

interface Props {
  model?: string
  onModelChange: (model: string) => void
}

const ModelSelector = observer(function ModelSelector(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)

  const freeMessageInfo = useQuery(api.apiKeys.getFreeMessageInfo)
  const hasApiKeys = freeMessageInfo?.hasApiKeys ?? false

  const selectedModel = getModelById(props.model ?? '')

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

  const filteredPopularModels = useMemo(() => {
    if (!searchQuery.trim()) {
      return POPULAR_MODELS
    }
    const query = searchQuery.toLowerCase()
    return POPULAR_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.subtitle.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query),
    )
  }, [searchQuery])

  const filteredOtherModels = useMemo(() => {
    if (!searchQuery.trim()) {
      setIsExpanded(false)
      return OTHER_MODELS
    }
    setIsExpanded(true)
    const query = searchQuery.toLowerCase()
    return OTHER_MODELS.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.subtitle.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query),
    )
  }, [searchQuery])

  const handleSelectModel = (model: RegisteredModel) => {
    props.onModelChange(model.id)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleToggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  const displayName = selectedModel
    ? `${selectedModel.name} ${selectedModel.subtitle}`.trim()
    : 'Select model'

  return (
    <Popover
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open)
        if (!open) {
          setSearchQuery('')
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          {selectedModel && (
            <ProviderIcon
              provider={selectedModel.provider}
              size={16}
              className="text-foreground"
            />
          )}
          <span className="max-w-[150px] truncate">{displayName}</span>
          <ChevronDownIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0 transition-all duration-200',
          isExpanded ? 'w-[700px]' : 'w-[400px]',
        )}
        align="start"
      >
        <div className="flex flex-col">
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('')
                  }
                }}
              />
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto p-3">
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="size-4" />
                <span>Favorites</span>
              </div>
              {isExpanded ? (
                <ModelGridView
                  models={filteredPopularModels}
                  selectedModelId={props.model}
                  onSelectModel={handleSelectModel}
                  isModelAvailable={isModelAvailable}
                />
              ) : (
                <ModelListView
                  models={filteredPopularModels}
                  selectedModelId={props.model}
                  onSelectModel={handleSelectModel}
                  isModelAvailable={isModelAvailable}
                />
              )}
            </div>

            {isExpanded && filteredOtherModels.length > 0 && (
              <div className="mt-6">
                <div className="mb-2 text-sm font-medium text-primary">Others</div>
                <ModelGridView
                  models={filteredOtherModels}
                  selectedModelId={props.model}
                  onSelectModel={handleSelectModel}
                  isModelAvailable={isModelAvailable}
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border px-3 py-2">
            <button
              onClick={handleToggleExpand}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronLeftIcon className="size-4" />
                  <span>Favorites</span>
                </>
              ) : (
                <>
                  <ChevronUpIcon className="size-4" />
                  <span>Show all</span>
                </>
              )}
              <span className="ml-1 size-2 rounded-full bg-primary" />
            </button>
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Filter className="size-4" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

export default ModelSelector

interface ModelViewProps {
  models: RegisteredModel[]
  selectedModelId?: string
  onSelectModel: (model: RegisteredModel) => void
  isModelAvailable: (modelId: string) => boolean
}

const ModelGridView = observer(function ModelGridView(props: ModelViewProps) {
  if (props.models.length === 0) {
    return <div className="py-4 text-center text-sm text-muted-foreground">No models found</div>
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {props.models.map((model) => (
        <ModelCard
          key={model.id}
          model={model}
          isSelected={props.selectedModelId === model.id}
          isAvailable={props.isModelAvailable(model.id)}
          onClick={() => props.onSelectModel(model)}
        />
      ))}
    </div>
  )
})

const ModelListView = observer(function ModelListView(props: ModelViewProps) {
  if (props.models.length === 0) {
    return <div className="py-4 text-center text-sm text-muted-foreground">No models found</div>
  }

  return (
    <div className="flex flex-col gap-1">
      {props.models.map((model) => {
        const available = props.isModelAvailable(model.id)
        return (
          <button
            key={model.id}
            onClick={() => available && props.onSelectModel(model)}
            disabled={!available}
            className={cn(
              'flex items-center justify-between rounded-md px-3 py-2 transition-colors',
              available && 'hover:bg-accent',
              props.selectedModelId === model.id && 'bg-accent',
              !available && 'cursor-not-allowed opacity-50',
            )}
          >
            <div className="flex items-center gap-3">
              <ProviderIcon
                provider={model.provider}
                size={20}
                className="text-muted-foreground"
              />
              <span className="text-sm text-foreground">
                {model.name} {model.subtitle}
              </span>
              {model.isPremium && (
                <span className="text-primary">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                </span>
              )}
            </div>
            <CapabilityIcons capabilities={model.capabilities} />
          </button>
        )
      })}
    </div>
  )
})

