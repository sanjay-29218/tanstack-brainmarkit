import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  // Kept so the starter `src/routes/*` pages still work while you migrate UI.
  numbers: defineTable({
    value: v.number(),
  }),

  users: defineTable({
    id: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
    image: v.optional(v.string()),
    isPremium: v.boolean(),
    role: v.optional(v.string()),
    banned: v.optional(v.boolean()),
    banReason: v.optional(v.string()),
    banExpires: v.optional(v.number()),
    freeMessageCount: v.number(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  }).index('by_appId', ['id']),

  threads: defineTable({
    id: v.string(),
    title: v.string(),
    model: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_appId', ['id'])
    .index('by_userId_updatedAt', ['userId', 'updatedAt']),

  threadMessages: defineTable({
    id: v.string(),
    threadId: v.string(),
    parentMessageId: v.optional(v.string()),
    childrenMessageIds: v.array(v.string()),
    isActive: v.boolean(),
    version: v.number(),
    parts: v.array(v.any()),
    role: v.union(v.literal('user'), v.literal('assistant')),
    model: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_appId', ['id'])
    .index('by_threadId', ['threadId'])
    .index('by_thread_role_parent', ['threadId', 'role', 'parentMessageId']),

  apiKeys: defineTable({
    id: v.string(),
    key: v.string(),
    providerName: v.string(),
    modelProviderId: v.string(),
    userId: v.string(),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_appId', ['id'])
    .index('by_userId', ['userId'])
    .index('by_userId_provider', ['userId', 'modelProviderId'])
    .index('by_userId_and_isActive', ['userId', 'isActive'])
    .index('by_userId_provider_isActive', ['userId', 'modelProviderId', 'isActive']),

  uploadedFiles: defineTable({
    id: v.string(),
    userId: v.string(),
    objectKey: v.string(),
    fileUrl: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    size: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),

  userPreferences: defineTable({
    id: v.string(),
    userId: v.string(),
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
    traits: v.array(v.string()),
    additionalInfo: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_userId', ['userId']),
})
