import { createFileRoute } from '@tanstack/react-router'
import VerifyEmail from '@/pages/auth/VerifyEmail'

export const Route = createFileRoute('/verify-email')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      email: typeof search.email === 'string' ? search.email : undefined,
    }
  },
  component: VerifyEmailRoute,
})

function VerifyEmailRoute() {
  const { email } = Route.useSearch()
  return <VerifyEmail email={email} />
}
