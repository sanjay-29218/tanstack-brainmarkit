import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireUserId } from './lib/auth'

export const ensure = mutation({
  args: {
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerified: v.optional(v.boolean()),
  },
  returns: v.object({
    id: v.string(),
    created: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('users')
      .withIndex('by_appId', (q) => q.eq('id', userId))
      .first()

    const now = Date.now()
    if (!existing) {
      await ctx.db.insert('users', {
        id: userId,
        name: args.name,
        email: args.email,
        emailVerified: args.emailVerified,
        image: args.image,
        isPremium: false,
        role: undefined,
        banned: false,
        banReason: undefined,
        banExpires: undefined,
        freeMessageCount: 0,
        createdAt: now,
        updatedAt: now,
      })
      return { id: userId, created: true }
    }

    const updates: Record<string, unknown> = { updatedAt: now }
    if (args.name !== undefined) updates.name = args.name
    if (args.email !== undefined) updates.email = args.email
    if (args.emailVerified !== undefined) updates.emailVerified = args.emailVerified
    if (args.image !== undefined) updates.image = args.image

    if (Object.keys(updates).length > 1) {
      await ctx.db.patch('users', existing._id, updates)
    }

    return { id: userId, created: false }
  },
})

export const incrementFreeMessageCount = mutation({
  args: {},
  returns: v.object({
    freeMessageCount: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('users')
      .withIndex('by_appId', (q) => q.eq('id', userId))
      .first()

    const now = Date.now()
    if (!existing) {
      await ctx.db.insert('users', {
        id: userId,
        isPremium: false,
        freeMessageCount: 1,
        createdAt: now,
        updatedAt: now,
      })
      return { freeMessageCount: 1 }
    }

    const nextCount = existing.freeMessageCount + 1
    await ctx.db.patch('users', existing._id, {
      freeMessageCount: nextCount,
      updatedAt: now,
    })
    return { freeMessageCount: nextCount }
  },
})

