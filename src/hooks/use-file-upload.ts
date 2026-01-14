import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAction, useMutation } from 'convex/react'
import { api } from '@/lib/convex-api'
import FileUploadModel, { type ExtendedFile } from '@/pages/chat/shared/file-upload/FileUploadModel'
import { createId } from '@/lib/id'

interface UseFileUploadReturn {
  fileUploadModel: FileUploadModel
  handleFileSelect: (selectedFiles: File[]) => Promise<void>
  isUploading: boolean
  hasFiles: boolean
  clearFiles: () => void
  getFileParts: () => Array<{
    type: 'file'
    mediaType: string
    url: string
    filename: string
  }>
}

export const useFileUpload = (): UseFileUploadReturn => {
  const [fileUploadModel] = useState(() => new FileUploadModel())

  const presignUploadUrls = useAction(api.uploads.presignUploadUrls)
  const saveMetadataBatch = useMutation(api.uploads.saveMetadataBatch)

  const getPresignedUrls = useCallback(async () => {
    const filesToPresign = fileUploadModel.getFilesToPresign()
    if (filesToPresign.length === 0) return

    try {
      const filesWithPresignedUrls = await presignUploadUrls({
        files: filesToPresign,
      })
      fileUploadModel.updateFiles(
        filesWithPresignedUrls.map(
          (f) =>
            ({
              id: f.tempId,
              presignedUrl: f.presignedUrl,
              objectKey: f.objectKey,
            }) as ExtendedFile,
        ),
      )
    } catch (error) {
      console.error(error)
      toast.error(
        `Failed to presign upload urls: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }, [fileUploadModel, presignUploadUrls])

  const uploadFiles = useCallback(async () => {
    try {
      const uploadedFiles = await fileUploadModel.uploadFiles()
      if (!uploadedFiles || uploadedFiles.length === 0) return

      const saved = await saveMetadataBatch({
        files: uploadedFiles.map((f) => ({
          objectKey: f.objectKey!,
          fileName: f.name,
          mimeType: f.type,
          size: f.size,
        })),
      })

      fileUploadModel.updateFiles(
        saved.map(
          (f) =>
            ({
              objectKey: f.objectKey,
              publicUrl: f.fileUrl,
              uploadProgress: 'completed',
              isUploading: false,
            }) as ExtendedFile,
        ),
      )
    } catch (error) {
      console.error(error)
      toast.error(
        `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }, [fileUploadModel, saveMetadataBatch])

  const handleFileSelect = useCallback(
    async (selectedFiles: File[]) => {
      fileUploadModel.addFiles(
        selectedFiles.map(
          (file) =>
            Object.assign(file, {
              id: createId(),
              isUploading: true,
              uploadProgress: 'pending',
              previewUrl: URL.createObjectURL(file),
            }) as ExtendedFile,
        ),
      )
      await getPresignedUrls()
      void uploadFiles()
    },
    [fileUploadModel, getPresignedUrls, uploadFiles],
  )

  const getFileParts = useCallback(() => {
    return fileUploadModel.files
      .map((file) => {
        const fileUrl = file.publicUrl || file.previewUrl || ''
        if (!fileUrl) return null
        return {
          type: 'file' as const,
          mediaType: file.type,
          url: fileUrl,
          filename: file.name,
        }
      })
      .filter(
        (
          part,
        ): part is {
          type: 'file'
          mediaType: string
          url: string
          filename: string
        } => part !== null,
      )
  }, [fileUploadModel])

  const clearFiles = useCallback(() => {
    fileUploadModel.clearFiles()
  }, [fileUploadModel])

  return {
    fileUploadModel,
    handleFileSelect,
    isUploading: fileUploadModel.isFileUploading(),
    hasFiles: fileUploadModel.hasFiles(),
    clearFiles,
    getFileParts,
  }
}

