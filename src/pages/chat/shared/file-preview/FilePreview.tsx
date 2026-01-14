import { useState } from 'react'
import { Loader2, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import Modal from '@/components/ui-element/Modal'

interface FilePreviewProps {
  src: string
  alt?: string
  previewUrl?: string
  className?: string
  enableLightbox?: boolean
  mediaType?: string
  filename?: string
}

const isBlobUrl = (url: string) => url.startsWith('blob:')

const isImageType = (mediaType?: string) => {
  return mediaType?.startsWith('image/') ?? false
}

const isPdfType = (mediaType?: string) => {
  return mediaType === 'application/pdf'
}

export function FilePreview({
  src,
  alt = 'File preview',
  previewUrl,
  className,
  enableLightbox = true,
  mediaType,
  filename,
}: FilePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isImage = isImageType(mediaType)
  const isPdf = isPdfType(mediaType)

  const isSrcBlob = isBlobUrl(src)
  const effectivePreviewUrl = previewUrl || (isSrcBlob ? src : undefined)
  const actualSrc = isSrcBlob && !previewUrl ? src : src

  const [imageSrc, setImageSrc] = useState(effectivePreviewUrl || actualSrc)

  const handleImageLoad = () => {
    setIsLoading(false)
    if (
      effectivePreviewUrl &&
      imageSrc === effectivePreviewUrl &&
      actualSrc !== effectivePreviewUrl
    ) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(actualSrc)
      }
      img.onerror = () => {
        // Keep using previewUrl if src fails
      }
      img.src = actualSrc
    }
  }

  const handleImageError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  const pdfContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-gray-500/50 bg-muted',
        className,
      )}
    >
      <div className="flex size-full min-h-32 items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileIcon className="size-8 text-red-500" />
          <span className="text-xs truncate max-w-[100px]" title={filename || alt}>
            {filename || 'PDF'}
          </span>
        </div>
      </div>
    </div>
  )

  const imageContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-gray-500/50 bg-muted',
        className,
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {hasError ? (
        <div className="flex size-full min-h-32 items-center justify-center bg-muted">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="size-8" />
            <span className="text-xs">Failed to load image</span>
          </div>
        </div>
      ) : (
        <img
          src={imageSrc}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={cn(
            'max-w-full object-cover transition-opacity',
            isLoading ? 'opacity-0' : 'opacity-100',
          )}
          style={{
            maxHeight: '120px',
            maxWidth: '120px',
            width: 'auto',
            height: 'auto',
          }}
        />
      )}
    </div>
  )

  const fileContent = (
    <div
      className={cn(
        'relative overflow-hidden rounded-md border border-gray-500/50 bg-muted',
        className,
      )}
    >
      <div className="flex size-full min-h-32 items-center justify-center bg-muted">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <FileIcon className="size-8" />
          <span className="text-xs truncate max-w-[100px]" title={filename}>
            {filename || 'File'}
          </span>
        </div>
      </div>
    </div>
  )

  const previewContent = isImage ? imageContent : isPdf ? pdfContent : fileContent

  if (isPdf || (!isImage && !hasError)) {
    const lightboxSrc = actualSrc

    return (
      <>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="cursor-pointer transition-transform hover:scale-[1.02]"
          aria-label={isPdf ? 'View PDF' : 'View file'}
        >
          {previewContent}
        </button>
        <Modal
          title={filename || (isPdf ? 'PDF Viewer' : 'File Viewer')}
          description={isPdf ? 'View PDF document' : 'View file'}
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          footerButtons={[]}
        >
          <div className="relative flex items-center justify-center bg-black/90 min-h-[70vh]">
            {isPdf ? (
              <iframe src={lightboxSrc} className="w-full h-[70vh] border-0" title={alt} />
            ) : (
              <div className="flex items-center justify-center p-8">
                <a
                  href={lightboxSrc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:underline"
                >
                  {filename || 'Download file'}
                </a>
              </div>
            )}
          </div>
        </Modal>
      </>
    )
  }

  if (!enableLightbox || hasError) {
    return previewContent
  }

  const lightboxSrc = imageSrc !== effectivePreviewUrl ? imageSrc : src

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="cursor-zoom-in transition-transform hover:scale-[1.02]"
        aria-label="View full size image"
      >
        {previewContent}
      </button>
      <Modal
        title={filename || alt || 'Image Preview'}
        description="View full size image"
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footerButtons={[]}
      >
        <div className="relative flex items-center justify-center bg-black/90 min-h-[70vh]">
          <img src={lightboxSrc} alt={alt} className="max-h-[70vh] max-w-full object-contain" />
        </div>
      </Modal>
    </>
  )
}

interface FilePreviewListProps {
  files: Array<{
    url: string
    previewUrl?: string
    alt?: string
    mediaType?: string
    filename?: string
  }>
  className?: string
}

export function FilePreviewList({ files, className }: FilePreviewListProps) {
  if (files.length === 0) return null

  return (
    <div className={cn('flex flex-wrap-reverse gap-2 mt-2', className)}>
      <div className="flex-1"></div>
      {files.map((file, index) => (
        <FilePreview
          key={index}
          src={file.url}
          previewUrl={file.previewUrl}
          alt={file.alt || file.filename || `File ${index + 1}`}
          className="max-w-full"
          mediaType={file.mediaType}
          filename={file.filename}
        />
      ))}
    </div>
  )
}

// Keep ImagePreviewList for backward compatibility
export function ImagePreviewList({
  images,
  className,
}: {
  images: Array<{ url: string; previewUrl?: string; alt?: string }>
  className?: string
}) {
  return (
    <FilePreviewList
      files={images.map((img) => ({
        url: img.url,
        previewUrl: img.previewUrl,
        alt: img.alt,
        mediaType: 'image/*',
      }))}
      className={className}
    />
  )
}

