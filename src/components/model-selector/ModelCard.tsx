import type { RegisteredModel } from '@/constants/model-registry'
import { observer } from 'mobx-react-lite'
import { cn } from '@/lib/utils'
import ProviderIcon from './ProviderIcon'
import CapabilityIcons from './CapabilityIcons'
import { Diamond } from 'lucide-react'

interface Props {
  model: RegisteredModel
  isSelected: boolean
  isAvailable: boolean
  onClick: () => void
}

const ModelCard = observer(function ModelCard(props: Props) {
  const model = props.model

  const handleClick = () => {
    if (!props.isAvailable) return
    props.onClick()
  }

  return (
    <button
      onClick={handleClick}
      disabled={!props.isAvailable}
      className={cn(
        'relative flex min-h-[140px] w-full flex-col items-center justify-between rounded-lg border p-3 transition-all',
        'bg-card hover:bg-accent',
        props.isSelected && 'border-primary bg-accent',
        !props.isSelected && 'border-border',
        !props.isAvailable && 'cursor-not-allowed opacity-50',
      )}
    >
      {model.isPremium && (
        <div className="absolute right-2 top-2">
          <Diamond className="size-4 text-primary" />
        </div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-1">
        <ProviderIcon provider={model.provider} size={32} className="text-foreground" />
        <div className="mt-2 text-center">
          <div className="text-sm font-medium text-foreground">{model.name}</div>
          {model.subtitle && (
            <div
              className={cn(
                'text-xs',
                model.subtitle.includes('Reasoning') || model.subtitle.includes('Thinking')
                  ? 'text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {model.subtitle}
            </div>
          )}
        </div>
      </div>

      <CapabilityIcons capabilities={model.capabilities} className="mt-2" />
    </button>
  )
})

export default ModelCard

