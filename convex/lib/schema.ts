import { z } from 'zod'
import type { UIMessage } from 'ai'

export const postRequestBodySchema = z.object({
  threadId: z.uuid(),
  userMessage: z.object({
    id: z.string(),
    role: z.enum(['user', 'assistant', 'system', 'tool']),
    parts: z.array(z.any()),
  }) as z.ZodType<UIMessage>,
  prevMessages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(['user', 'assistant', 'system', 'tool']),
      parts: z.array(z.any()),
    }),
  ) as z.ZodType<Array<UIMessage>>,
  model: z.string().optional(),
})

export type PostRequestBody = z.infer<typeof postRequestBodySchema>
