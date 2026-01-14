import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft } from 'lucide-react'

export default function VerifyEmail({ email }: { email?: string | null }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription className="text-base mt-2">
            We&apos;ve sent a verification link to
            {email ? (
              <span className="font-semibold text-foreground"> {email}</span>
            ) : (
              ' your email address'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>Please check your email and click on the verification link to activate your account.</p>
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="font-medium text-foreground">Didn&apos;t receive the email?</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Check your spam or junk folder</li>
                <li>Make sure you entered the correct email address</li>
                <li>The email may take a few minutes to arrive</li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button asChild className="w-full">
              <Link to="/login">Go to Login</Link>
            </Button>
            <Button asChild variant="ghost" className="w-full">
              <Link to="/register" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign Up
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

