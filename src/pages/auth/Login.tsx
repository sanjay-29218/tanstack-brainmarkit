import { useEffect, useState, type FormEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { useNavigate, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = Record<string, never>

const Login = observer(function Login(props: Props) {
  void props
  const navigate = useNavigate()
  const { data: session, isPending: isSessionLoading } = authClient.useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isSessionLoading) return
    if (!session) return
    void navigate({ to: '/' })
  }, [navigate, isSessionLoading, session])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isSubmitting) return

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      toast.error('Email and password are required')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      })

      const errorMessage =
        (res as unknown as { error?: { message?: string } })?.error?.message ??
        (res as unknown as { error?: string })?.error
      if (errorMessage) {
        toast.error(errorMessage)
        return
      }

      void navigate({ to: '/' })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-10">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="text-muted-foreground text-sm">Sign in with your email and password.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="password">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <div className="text-muted-foreground text-sm">
        Don’t have an account?{' '}
        <Link className="text-foreground underline" to="/register">
          Create one
        </Link>
      </div>
    </div>
  )
})

export default Login

