import { useEffect } from 'react'
import { useMutation } from 'convex/react'
import { api } from '@/lib/convex-api'
import { authClient } from '@/lib/auth-client'

export function AuthSync() {
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const ensureUser = useMutation(api.users.ensure)

  useEffect(() => {
    if (isSessionLoading) return

    const user = session?.user
    if (!user) return

    void ensureUser({
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      image: user.image ?? undefined,
    })
  }, [ensureUser, isSessionLoading, session])

  return null
}
