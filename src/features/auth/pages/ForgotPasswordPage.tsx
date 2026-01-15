import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/services/api/client'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  })

  const { errors, dirtyFields } = form.formState

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await apiClient.post('/api/v1/auth/forgot-password', data)
      toast.success('Password reset email sent. Check your inbox.')
      setSubmitted(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {/* Background gradient overlay */}
        <div
          className="fixed inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(/AuthBg.png)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 px-8 py-16">
          {/* Logo from Figma design */}
          <div className="flex flex-col items-center gap-4">
            <img 
              src="/logo-text-large.svg" 
              alt="TELE GNOST" 
              width={288} 
              height={48} 
              className="h-12 w-auto" 
            />
          </div>

          <div className="w-full max-w-4xl flex flex-col items-center gap-8 bg-sidebar rounded-2xl p-12 border border-border">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">Check Your Email</h2>
              <p className="mt-3 text-muted-foreground">
                We've sent password reset instructions to your email address. Please check your inbox and follow the link to
                reset your password.
              </p>
            </div>
            <Link to="/login" className="w-full">
              <button
                className={cn(
                  'w-full h-14 rounded-lg font-medium text-lg transition-colors',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90',
                  'active:bg-primary/80',
                  'flex items-center justify-center gap-2'
                )}
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Sign In
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Background gradient overlay - matching Figma design */}
      <div
        className="fixed inset-0 bg-cover bg-center opacity-30"
        style={{
          backgroundImage: `url(/AuthBg.png)`,
        }}
      />

      {/* Form Container */}
      <div className="relative z-10 flex flex-col items-center gap-12 px-8 py-16">
        {/* Logo from Figma design */}
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/logo-text-large.svg" 
            alt="TELE GNOST" 
            width={288} 
            height={48} 
            className="h-12 w-auto" 
          />
        </div>

        {/* Form Card - with proper Figma card styling */}
        <div className="w-full max-w-4xl flex flex-col items-center gap-8 bg-sidebar rounded-2xl p-10 border border-border">
          {/* Header */}
          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="text-2xl font-semibold text-foreground">Forgot Password</h1>
            <p className="text-muted-foreground text-sm text-center">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-8">
            {/* Email Field - matching Figma Login Input component */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <div
                className={cn(
                  'flex items-center gap-4 px-4 py-4 rounded-lg bg-secondary border transition-colors',
                  errors.email ? 'border-destructive' : dirtyFields.email ? 'border-primary' : 'border-border'
                )}
              >
                <Mail className="w-6 h-6 text-muted-foreground shrink-0" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  {...form.register('email')}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                />
              </div>
              {errors.email && <span className="text-sm text-destructive">{errors.email.message}</span>}
            </div>

            {/* Submit Button - matching Figma LogonButton component */}
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full h-14 rounded-lg font-medium text-lg transition-colors',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'active:bg-primary/80',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <span>Send Reset Link</span>
              )}
            </button>
          </form>

          {/* Back to Sign In Link */}
          <div className="pt-4 border-t border-border w-full flex justify-center">
            <Link to="/login" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
