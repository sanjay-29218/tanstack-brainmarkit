import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { getUserId, requireUserId } from './lib/auth'

export const listWithMessages = query({
  args: {
    paginationOpts: paginationOptsValidator,
    messageLimit: v.optional(v.number()),
  },
  returns: v.object({
    page: v.array(v.any()),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    splitCursor: v.union(v.string(), v.null()),
    pageStatus: v.union(
      v.literal('SplitRecommended'),
      v.literal('SplitRequired'),
      v.null(),
    ),
  }),
  handler: async (ctx, args) => {
    const userId = await getUserId(ctx)
    if (!userId) {
      const emptyPage = await ctx.db
        .query('threads')
        .withIndex('by_appId', (q) => q.eq('id', '__no_threads__'))
        .paginate(args.paginationOpts)
      return {
        page: [] as Array<any>,
        isDone: emptyPage.isDone,
        continueCursor: emptyPage.continueCursor,
        splitCursor: emptyPage.splitCursor ?? null,
        pageStatus: emptyPage.pageStatus ?? null,
      }
    }

    const page = await ctx.db
      .query('threads')
      .withIndex('by_userId_updatedAt', (q) => q.eq('userId', userId))
      .order('desc')
      .paginate(args.paginationOpts)

    const items = await Promise.all(
      page.page.map(async (thread) => {
        const messages = await ctx.db
          .query('threadMessages')
          .withIndex('by_threadId', (q) => q.eq('threadId', thread.id))
          .order('asc')
          .collect()

        const limited = args.messageLimit
          ? messages.slice(Math.max(0, messages.length - args.messageLimit))
          : messages

        return {
          id: thread.id,
          title: thread.title,
          model: thread.model,
          userId: thread.userId,
          createdAt: thread.createdAt,
          updatedAt: thread.updatedAt,
          messages: limited,
        }
      }),
    )

    return {
      page: items,
      isDone: page.isDone,
      continueCursor: page.continueCursor,
      splitCursor: page.splitCursor ?? null,
      pageStatus: page.pageStatus ?? null,
    }
  },
})

export const getOrUpdateThread = mutation({
  args: {
    threadId: v.string(),
    model: v.string(),
  },
  returns: v.object({
    id: v.string(),
    isNew: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('threads')
      .withIndex('by_appId', (q) => q.eq('id', args.threadId))
      .first()

    if (!existing) {
      return { id: args.threadId, isNew: true }
    }

    if (existing.userId !== userId) {
      throw new Error('Thread not found or unauthorized')
    }

    if (existing.model !== args.model) {
      await ctx.db.patch('threads', existing._id, {
        model: args.model,
        updatedAt: Date.now(),
      })
    }

    return { id: args.threadId, isNew: false }
  },
})

export const createThread = mutation({
  args: {
    threadId: v.string(),
    title: v.string(),
    model: v.string(),
  },
  returns: v.object({
    id: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('threads')
      .withIndex('by_appId', (q) => q.eq('id', args.threadId))
      .first()

    if (existing) {
      return { id: existing.id }
    }

    const now = Date.now()
    await ctx.db.insert('threads', {
      id: args.threadId,
      userId,
      title: args.title,
      model: args.model,
      createdAt: now,
      updatedAt: now,
    })

    return { id: args.threadId }
  },
})

export const updateThreadModel = mutation({
  args: {
    threadId: v.string(),
    model: v.string(),
  },
  returns: v.object({
    threadId: v.string(),
    model: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('threads')
      .withIndex('by_appId', (q) => q.eq('id', args.threadId))
      .first()

    if (!existing || existing.userId !== userId) {
      throw new Error('Thread not found or unauthorized')
    }

    await ctx.db.patch('threads', existing._id, {
      model: args.model,
      updatedAt: Date.now(),
    })

    return { threadId: args.threadId, model: args.model }
  },
})

export const deleteChat = mutation({
  args: { threadId: v.string() },
  returns: v.object({
    id: v.string(),
  }),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const existing = await ctx.db
      .query('threads')
      .withIndex('by_appId', (q) => q.eq('id', args.threadId))
      .first()

    if (!existing || existing.userId !== userId) {
      return { id: args.threadId }
    }

    const messages = await ctx.db
      .query('threadMessages')
      .withIndex('by_threadId', (q) => q.eq('threadId', args.threadId))
      .collect()

    for (const message of messages) {
      await ctx.db.delete('threadMessages', message._id)
    }

    await ctx.db.delete('threads', existing._id)

    return { id: args.threadId }
  },
})
