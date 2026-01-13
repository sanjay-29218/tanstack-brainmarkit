"use node"

import { v } from 'convex/values'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { action, mutation } from './_generated/server'
import { requireUserId } from './lib/auth'

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
const R2_BUCKET = process.env.R2_BUCKET_NAME
const R2_PUBLIC_BASE_URL = process.env.R2_PUBLIC_BASE_URL

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

const presignUploadUrl = async (fileName: string, mimeType: string, size: number) => {
  if (!R2_BUCKET) {
    throw new Error('R2_BUCKET_NAME must be set')
  }
  const objectKey = `${crypto.randomUUID()}-${fileName}`
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: objectKey,
    ContentType: mimeType,
    ContentLength: size,
  })
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 24 * 60 * 60,
  })
  return { presignedUrl, objectKey }
}

export const presignUploadUrls = action({
  args: {
    files: v.array(
      v.object({
        tempId: v.string(),
        fileName: v.string(),
        mimeType: v.string(),
        size: v.number(),
      }),
    ),
  },
  returns: v.array(
    v.object({
      tempId: v.string(),
      presignedUrl: v.string(),
      objectKey: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    await requireUserId(ctx)

    const filesWithPresignedUrls = await Promise.all(
      args.files.map(async (file) => {
        const { presignedUrl, objectKey } = await presignUploadUrl(file.fileName, file.mimeType, file.size)
        return {
          tempId: file.tempId,
          presignedUrl,
          objectKey,
        }
      }),
    )

    return filesWithPresignedUrls
  },
})

export const saveMetadataBatch = mutation({
  args: {
    files: v.array(
      v.object({
        objectKey: v.string(),
        fileName: v.string(),
        mimeType: v.string(),
        size: v.number(),
      }),
    ),
  },
  returns: v.array(
    v.object({
      id: v.string(),
      fileUrl: v.string(),
      objectKey: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    if (!R2_PUBLIC_BASE_URL) {
      throw new Error('R2_PUBLIC_BASE_URL must be set')
    }

    const now = Date.now()
    const inserted: Array<{ id: string; fileUrl: string; objectKey: string }> = []

    for (const file of args.files) {
      const id = crypto.randomUUID()
      const fileUrl = `${R2_PUBLIC_BASE_URL}/${file.objectKey}`
      await ctx.db.insert('uploadedFiles', {
        id,
        userId,
        objectKey: file.objectKey,
        fileUrl,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        createdAt: now,
        updatedAt: now,
      })
      inserted.push({ id, fileUrl, objectKey: file.objectKey })
    }

    return inserted
  },
})

