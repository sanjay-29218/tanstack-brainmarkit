import { v } from 'convex/values'
import { mutation } from './_generated/server'
import { requireUserId } from './lib/auth'

const getNextSiblingVersion = async (
  ctx: any,
  props: {
    threadId: string
    parentMessageId: string
    role: 'user' | 'assistant'
  },
) => {
  const existing = await ctx.db
    .query('threadMessages')
    .withIndex('by_thread_role_parent', (q: any) =>
      q.eq('threadId', props.threadId).eq('role', props.role).eq('parentMessageId', props.parentMessageId),
    )
    .order('desc')
    .first()

  const currentMax = existing?.version ?? 0
  return currentMax + 1
}

const appendChildMessageIdToParent = async (
  ctx: any,
  parentMessageId: string | undefined,
  childMessageId: string,
) => {
  if (!parentMessageId) return
  if (!parentMessageId.trim()) return
  if (!childMessageId) return
  if (parentMessageId === childMessageId) return

  const parent = await ctx.db
    .query('threadMessages')
    .withIndex('by_appId', (q: any) => q.eq('id', parentMessageId))
    .first()

  if (!parent) return

  const existingChildren = parent.childrenMessageIds ?? []
  const sanitizedChildren = existingChildren.filter((id: string) => !!id && id !== parentMessageId)
  if (sanitizedChildren.includes(childMessageId)) return

  await ctx.db.patch('threadMessages', parent._id, {
    childrenMessageIds: [...sanitizedChildren, childMessageId],
    updatedAt: Date.now(),
  })
}

export const saveUserMessage = mutation({
  args: {
    threadId: v.string(),
    messageId: v.string(),
    parts: v.array(v.any()),
    parentMessageId: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const thread = await ctx.db
      .query('threads')
      .withIndex('by_appId', (q) => q.eq('id', args.threadId))
      .first()

    if (!thread || thread.userId !== userId) {
      throw new Error('Thread not found or unauthorized')
    }

    const existing = await ctx.db
      .query('threadMessages')
      .withIndex('by_appId', (q) => q.eq('id', args.messageId))
      .first()

    const resolvedParentMessageId =
      args.parentMessageId && args.parentMessageId !== args.messageId ? args.parentMessageId : ''

    if (!existing) {
      const nextVersion = await getNextSiblingVersion(ctx, {
        threadId: args.threadId,
        parentMessageId: resolvedParentMessageId,
        role: 'user',
      })

      await ctx.db.insert('threadMessages', {
        id: args.messageId,
        threadId: args.threadId,
        parts: args.parts,
        role: 'user',
        parentMessageId: resolvedParentMessageId,
        childrenMessageIds: [],
        isActive: true,
        version: nextVersion,
        model: args.model,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }

    await appendChildMessageIdToParent(ctx, resolvedParentMessageId, args.messageId)
    await ctx.db.patch('threads', thread._id, { updatedAt: Date.now() })

    return null
  },
})

export const saveAssistantMessage = mutation({
  args: {
    threadId: v.string(),
    messageId: v.string(),
    parts: v.array(v.any()),
    parentMessageId: v.string(),
    errorMessage: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx)
    const thread = await ctx.db
      .query('threads')
      .withIndex('by_appId', (q) => q.eq('id', args.threadId))
      .first()

    if (!thread || thread.userId !== userId) {
      throw new Error('Thread not found or unauthorized')
    }

    const nextVersion = await getNextSiblingVersion(ctx, {
      threadId: args.threadId,
      parentMessageId: args.parentMessageId,
      role: 'assistant',
    })

    await ctx.db.insert('threadMessages', {
      id: args.messageId,
      threadId: args.threadId,
      parts: args.parts,
      role: 'assistant',
      parentMessageId: args.parentMessageId,
      childrenMessageIds: [],
      isActive: true,
      version: nextVersion,
      errorMessage: args.errorMessage,
      model: args.model,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })

    await appendChildMessageIdToParent(ctx, args.parentMessageId, args.messageId)
    await ctx.db.patch('threads', thread._id, { updatedAt: Date.now() })

    return null
  },
})

