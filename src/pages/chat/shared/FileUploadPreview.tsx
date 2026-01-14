import { X, Loader2, File, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ExtendedFile } from './file-upload/FileUploadModel'
import { observer } from 'mobx-react-lite'

interface FilePreviewProps {
  files: ExtendedFile[]
  onRemove: (id: string) => void
}

const FileUploadPreviewList = observer(function FileUploadPreviewList({
  files,
  onRemove,
}: FilePreviewProps) {
  if (files.length === 0) return null

  const isImage = (mimeType: string | undefined) => {
    return mimeType?.startsWith('image/') ?? false
  }

  return (
    <div className="flex w-full gap-2 overflow-x-auto pb-2">
      {files.map((fileItem) => (
        <div
          key={fileItem.id}
          className="relative flex-shrink-0 size-20 overflow-hidden rounded-md border border-gray-500/50 bg-background"
        >
          {isImage(fileItem.type) && fileItem.previewUrl ? (
            <img
              src={fileItem.previewUrl}
              alt={fileItem.name}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <File className="size-8 text-muted-foreground" />
            </div>
          )}

          {fileItem.isUploading && fileItem.uploadProgress !== 'completed' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              {fileItem.uploadProgress !== 'failed' && (
                <div className="flex flex-col items-center gap-1">
                  <Loader2 className="size-6 animate-spin text-white" />
                </div>
              )}
              {fileItem.uploadProgress === 'failed' && (
                <div className="flex flex-col items-center gap-1">
                  <AlertCircle className="size-6 text-red-500" />
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => onRemove(fileItem.id)}
            className={cn(
              'absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white transition-opacity hover:bg-black/90',
              fileItem.isUploading && 'pointer-events-none opacity-50',
            )}
            type="button"
            aria-label="Remove file"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  )
})

export default FileUploadPreviewList

