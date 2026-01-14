import { useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/lib/convex-api'
import { authClient } from '@/lib/auth-client'

export function AuthSync() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const ensureUser = useMutation(api.users.ensure)

  useEffect(() => {
    if (isSessionLoading) return
    type SessionUser = {
      name?: string | null
      email?: string | null
      emailVerified?: boolean | null
      image?: string | null
    }
    type SessionData = { user?: SessionUser | null }

    const user = (session as unknown as SessionData)?.user
    if (!user) return

    void ensureUser({
      name: user.name ?? undefined,
      email: user.email ?? undefined,
      emailVerified: user.emailVerified ?? undefined,
      image: user.image ?? undefined,
    })
  }, [ensureUser, isSessionLoading, session])

  return null
}

