import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId, requireUserId } from './lib/auth'

const preferenceValidator = v.object({
  id: v.string(),
  userId: v.string(),
  name: v.union(v.string(), v.null()),
  occupation: v.union(v.string(), v.null()),
  traits: v.array(v.string()),
  additionalInfo: v.union(v.string(), v.null()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

export const get = query({
  args: {},
  returns: v.union(preferenceValidator, v.null()),
  handler: async (ctx) => {
    const userId = await getUserId(ctx)
    if (!userId) return null
    const row = await ctx.db
      .query('userPreferences')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()
    if (!row) return null

    return {
      id: row.id,
      userId: row.userId,
      name: row.name ?? null,
      occupation: row.occupation ?? null,
      traits: row.traits,
      additionalInfo: row.additionalInfo ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  },
})

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    occupation: v.optional(v.string()),
    traits: v.optional(v.array(v.string())),
    additionalInfo: v.optional(v.string()),
  },
  returns: preferenceValidator,
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('userPreferences')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .first()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch('userPreferences', existing._id, {
        name: args.name ?? existing.name,
        occupation: args.occupation ?? existing.occupation,
        traits: args.traits ?? existing.traits,
        additionalInfo: args.additionalInfo ?? existing.additionalInfo,
        updatedAt: now,
      })
      const row = await ctx.db.get('userPreferences', existing._id)
      if (!row) throw new Error('Preference update failed')
      return {
        id: row.id,
        userId: row.userId,
        name: row.name ?? null,
        occupation: row.occupation ?? null,
        traits: row.traits,
        additionalInfo: row.additionalInfo ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }
    }

    const createdId = await ctx.db.insert('userPreferences', {
      id: crypto.randomUUID(),
      userId,
      name: args.name ?? undefined,
      occupation: args.occupation ?? undefined,
      traits: args.traits ?? [],
      additionalInfo: args.additionalInfo ?? undefined,
      createdAt: now,
      updatedAt: now,
    })

    const row = await ctx.db.get('userPreferences', createdId)
    if (!row) throw new Error('Preference insert failed')
    return {
      id: row.id,
      userId: row.userId,
      name: row.name ?? null,
      occupation: row.occupation ?? null,
      traits: row.traits,
      additionalInfo: row.additionalInfo ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  },
})
