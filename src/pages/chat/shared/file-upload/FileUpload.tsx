import { Button } from '@/components/ui/button'
import { Paperclip } from 'lucide-react'
import { useRef } from 'react'
import { cn } from '@/lib/utils'
import { TooltipText } from '@/components/ui/tooltip'

interface FileUploadProps {
  onFileSelect: (files: File[]) => void
  disabled?: boolean
  maxFiles?: number
  currentFileCount?: number
}

export default function FileUpload({
  onFileSelect,
  disabled,
  maxFiles = 3,
  currentFileCount = 0,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    const remainingSlots = maxFiles - currentFileCount
    if (remainingSlots <= 0) {
      return
    }

    const filesToAdd = selectedFiles.slice(0, remainingSlots)
    onFileSelect(filesToAdd)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleButtonClick = () => {
    if (!disabled && currentFileCount < maxFiles) {
      fileInputRef.current?.click()
    }
  }

  const isAtLimit = currentFileCount >= maxFiles

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,.doc,.docx,.txt"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isAtLimit}
        multiple
      />
      <TooltipText text={isAtLimit ? `Maximum ${maxFiles} files allowed` : 'Upload file (max 3)'}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            'size-10 cursor-pointer rounded-full',
            (disabled || isAtLimit) && 'cursor-not-allowed opacity-50',
          )}
          onClick={handleButtonClick}
          disabled={disabled || isAtLimit}
          aria-label="Upload file"
        >
          <Paperclip className="size-4" />
        </Button>
      </TooltipText>
    </>
  )
}

