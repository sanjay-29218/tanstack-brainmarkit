import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TrashIcon, CopyIcon } from 'lucide-react'
import type { ApiKey } from './ApiKeySettingModel'
import { observer } from 'mobx-react-lite'

interface ProviderApiKeyInputProps {
  apiKey: ApiKey
  onValueChange: (value: string) => void
  onBlur: () => void
  onDelete: () => void
  isDeleting?: boolean
  isSaving?: boolean
}

const ProviderApiKeyInput = observer(function ProviderApiKeyInput({
  apiKey,
  onValueChange,
  onBlur,
  onDelete,
  isDeleting = false,
  isSaving = false,
}: ProviderApiKeyInputProps) {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(apiKey.key || '')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex">
      <div className="w-full space-y-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={`key-${apiKey.id}`}>{apiKey.modelProviderId}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Input
            id={`key-${apiKey.id}`}
            type="password"
            placeholder={'Enter API key'}
            value={apiKey.key || ''}
            onChange={(e) => onValueChange(e.target.value)}
            onBlur={onBlur}
            disabled={isSaving || isDeleting}
          />
          {apiKey.key && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={isSaving || isDeleting}
              type="button"
            >
              <CopyIcon className="size-4" />
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            disabled={isDeleting || isSaving}
            type="button"
          >
            {isDeleting ? 'Deleting...' : <TrashIcon className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
})

export default ProviderApiKeyInput

