import { useEffect, useState } from 'react'
import { useNavigate, Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function EmailVerificationSuccess() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const { data: session, isPending: isSessionLoading } = authClient.useSession()

  const [message, setMessage] = useState('Verifying your email...')

  useEffect(() => {
    if (session && !isSessionLoading) {
      setStatus('success')
      setMessage('Email verified successfully! Redirecting you to the chat app...')
      const timer = setTimeout(() => {
        void navigate({ to: '/' })
      }, 3000)
      return () => clearTimeout(timer)
    } else if (isSessionLoading) {
      setStatus('loading')
      setMessage('Verifying your email...')
    } else {
      setStatus('error')
      setMessage('Verification failed. Please sign in again.')
    }
  }, [session, isSessionLoading, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
              <CardTitle>Verifying your email</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-12 w-12 text-green-500" />
              </div>
              <CardTitle>Email verified!</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
          {status === 'error' && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <CardTitle>Verification failed</CardTitle>
              <CardDescription>{message}</CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">Redirecting you to the chat app...</p>
              <Button asChild className="w-full">
                <Link to="/">Go to Chat</Link>
              </Button>
            </div>
          )}
          {status === 'error' && (
            <div className="text-center space-y-4">
              <Button asChild variant="outline" className="w-full">
                <Link to="/register">Sign up again</Link>
              </Button>
              <Button asChild className="w-full">
                <Link to="/login">Go to Login</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

