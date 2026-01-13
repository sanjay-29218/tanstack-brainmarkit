type AuthContext = {
  auth: {
    getUserIdentity: () => Promise<{ subject: string } | null>
  }
}

export async function getUserId(ctx: AuthContext): Promise<string | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

export async function requireUserId(ctx: AuthContext): Promise<string> {
  const userId = await getUserId(ctx)
  if (!userId) {
    throw new Error('Unauthorized')
  }
  return userId
}

