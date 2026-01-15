import { createFileRoute } from '@tanstack/react-router'
import EmailVerificationSuccess from '@/pages/auth/EmailVerificationSuccess'

export const Route = createFileRoute('/email-verification-success')({
  component: EmailVerificationSuccess,
})
