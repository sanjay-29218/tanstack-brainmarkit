import { action, makeObservable, observable } from 'mobx'

export interface ExtendedFile extends File {
  id: string
  isUploading?: boolean
  uploadProgress?: 'pending' | 'uploading' | 'completed' | 'failed'
  previewUrl?: string
  publicUrl?: string // url of the file in the public bucket
  presignedUrl?: string // url of the file in the presigned url
  objectKey?: string // object key of the file in the bucket
}

class FileUploadModel {
  files: ExtendedFile[] = []
  constructor() {
    makeObservable(this, {
      files: observable,
      addFile: action,
      removeFile: action,
      clearFiles: action,
      updateFiles: action,
      updatePublicUrls: action,
      uploadFiles: action,
    })
  }

  addFile(file: ExtendedFile) {
    this.files.push(file)
  }

  addFiles(files: ExtendedFile[]) {
    this.files.push(...files)
  }

  removeFile(id: string) {
    this.files = this.files.filter((f) => f.id !== id)
  }

  clearFiles() {
    this.files.forEach((f) => {
      if (f.previewUrl) {
        URL.revokeObjectURL(f.previewUrl)
      }
    })
    this.files = []
  }

  updateFiles(files: ExtendedFile[]) {
    files.forEach((file) => {
      const found = this.files.find((f) => f.id === file.id || f.objectKey === file.objectKey)
      if (found) {
        if (file.presignedUrl !== undefined) {
          found.presignedUrl = file.presignedUrl
        }
        if (file.objectKey !== undefined) {
          found.objectKey = file.objectKey
        }
        if (file.uploadProgress !== undefined) {
          found.uploadProgress = file.uploadProgress
        }
        if (file.isUploading !== undefined) {
          found.isUploading = file.isUploading
        }
        if (file.publicUrl !== undefined) {
          found.publicUrl = file.publicUrl
        }
      }
    })
  }

  updatePublicUrls(files: ExtendedFile[]) {
    files.forEach((file) => {
      const found = this.files.find((f) => f.objectKey === file.objectKey)
      if (found) {
        found.publicUrl = file.publicUrl
      }
    })
  }

  isFileUploading() {
    return this.files.some((f) => f.isUploading && f.uploadProgress !== 'completed')
  }

  getFileUploadProgress(id: string) {
    return this.files.find((f) => f.id === id)?.uploadProgress ?? 0
  }

  getFilePreviewUrl(id: string) {
    return this.files.find((f) => f.id === id)?.previewUrl ?? undefined
  }

  hasFiles() {
    return this.files.length > 0
  }

  getFilesToPresign() {
    return this.files
      .filter((f) => f.uploadProgress === 'pending')
      .map((f) => ({
        tempId: f.id,
        fileName: f.name,
        mimeType: f.type,
        size: f.size,
      }))
  }

  private getFilesToUpload() {
    const filesToUpload = this.files.filter(
      (f) => f.uploadProgress === 'pending' && f.presignedUrl && f.objectKey,
    )
    return filesToUpload
  }

  async uploadFiles() {
    const files = this.getFilesToUpload()

    if (files.length === 0) return

    try {
      const uploadedFiles = await Promise.all(
        files.map(async (f) => {
          const response = await fetch(f.presignedUrl!, {
            method: 'PUT',
            body: f,
            headers: {
              'Content-Type': f.type,
            },
          })
          if (!response.ok) {
            f.uploadProgress = 'failed'
          }
          return f
        }),
      )
      return uploadedFiles
    } catch (error) {
      console.error(error)
      throw new Error(
        `Failed to upload files: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }
}

export default FileUploadModel

