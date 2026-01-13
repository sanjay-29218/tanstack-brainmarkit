import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId, requireUserId } from './lib/auth'
import { decrypt, encrypt, maskApiKey } from './lib/encryption'

const FREE_TIER_MESSAGE_LIMIT = 10

const apiKeyClientShape = v.object({
  id: v.string(),
  modelProviderId: v.string(),
  key: v.union(v.string(), v.null()),
})

export const list = query({
  args: {},
  returns: v.array(apiKeyClientShape),
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return []
    const rows = await ctx.db.query('apiKeys').withIndex('by_userId', (q) => q.eq('userId', userId)).collect()

    return rows.map((row) => ({
      id: row.id,
      modelProviderId: row.modelProviderId,
      key: maskApiKey(row.key),
    }))
  },
})

export const hasActiveKeys = query({
  args: {},
  returns: v.object({ hasApiKeys: v.boolean() }),
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return { hasApiKeys: false }
    const active = await ctx.db
      .query('apiKeys')
      .withIndex('by_userId_and_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
      .first()
    return { hasApiKeys: !!active }
  },
})

export const getFreeMessageInfo = query({
  args: {},
  returns: v.object({
    hasApiKeys: v.boolean(),
    remainingMessages: v.union(v.number(), v.null()),
    totalFreeMessages: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) {
      return {
        hasApiKeys: false,
        remainingMessages: FREE_TIER_MESSAGE_LIMIT,
        totalFreeMessages: FREE_TIER_MESSAGE_LIMIT,
      }
    }

    const activeKey = await ctx.db
      .query('apiKeys')
      .withIndex('by_userId_and_isActive', (q) => q.eq('userId', userId).eq('isActive', true))
      .first()

    if (activeKey) {
      return {
        hasApiKeys: true,
        remainingMessages: null,
        totalFreeMessages: FREE_TIER_MESSAGE_LIMIT,
      }
    }

    const user = await ctx.db.query('users').withIndex('by_appId', (q) => q.eq('id', userId)).first()
    const currentCount = user?.freeMessageCount ?? 0
    const remainingMessages = Math.max(0, FREE_TIER_MESSAGE_LIMIT - currentCount)

    return {
      hasApiKeys: false,
      remainingMessages,
      totalFreeMessages: FREE_TIER_MESSAGE_LIMIT,
    }
  },
})

export const getOpenRouterKeyEncrypted = query({
  args: {},
  returns: v.object({ encryptedKey: v.union(v.string(), v.null()) }),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const row = await ctx.db
      .query('apiKeys')
      .withIndex('by_userId_provider_isActive', (q) =>
        q.eq('userId', userId).eq('modelProviderId', 'openrouter').eq('isActive', true),
      )
      .first()
    return { encryptedKey: row?.key ?? null }
  },
})

export const getOpenRouterKey = query({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const row = await ctx.db
      .query('apiKeys')
      .withIndex('by_userId_provider_isActive', (q) =>
        q.eq('userId', userId).eq('modelProviderId', 'openrouter').eq('isActive', true),
      )
      .first()

    if (!row?.key) {
      throw new Error('OpenRouter API key not found')
    }

    return decrypt(row.key)
  },
})

export const deleteKey = mutation({
  args: { id: v.string() },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db.query('apiKeys').withIndex('by_appId', (q) => q.eq('id', args.id)).first()

    if (!existing || existing.userId !== userId) {
      return { id: args.id }
    }

    await ctx.db.delete('apiKeys', existing._id)
    return { id: args.id }
  },
})

export const create = mutation({
  args: {
    providerId: v.string(),
    key: v.string(),
    providerName: v.string(),
  },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    if (!args.key || !args.key.trim()) {
      throw new Error('API key cannot be empty')
    }

    const encryptedKey = encrypt(args.key)
    const id = crypto.randomUUID()
    const now = Date.now()

    await ctx.db.insert('apiKeys', {
      id,
      modelProviderId: args.providerId,
      key: encryptedKey,
      providerName: args.providerName,
      userId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    return { id }
  },
})

export const update = mutation({
  args: {
    id: v.string(),
    key: v.string(),
  },
  returns: v.object({ id: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    if (!args.key || !args.key.trim()) {
      throw new Error('API key cannot be empty')
    }

    const encryptedKey = encrypt(args.key)
    const existing = await ctx.db.query('apiKeys').withIndex('by_appId', (q) => q.eq('id', args.id)).first()

    if (!existing || existing.userId !== userId) {
      throw new Error('API key not found')
    }

    await ctx.db.patch('apiKeys', existing._id, {
      key: encryptedKey,
      updatedAt: Date.now(),
    })

    return { id: args.id }
  },
})

