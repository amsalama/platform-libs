import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Mail, Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormError } from '@/components/shared/FormError'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(255, 'Username must be less than 255 characters'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const from = (location.state as { from?: string })?.from || '/'

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const { errors, isSubmitting, dirtyFields } = form.formState

  const handleLoginSubmit = async (data: LoginFormData) => {
    setError(null)
    try {
      await login(data.username, data.password)
      navigate(from, { replace: true })
    } catch (err) {
      console.error('[LoginPage] Login failed', err)
      setError(err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {/* Background image overlay - matching Figma design */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-30 invert dark:invert-0"
        style={{ 
          backgroundImage: `url(/AuthBg.png)`,
        }}
      />
      
      <div className="relative z-10 flex flex-col items-center gap-12 px-8 py-16">
        
        

        <div className="w-full max-w-4xl flex flex-col items-center gap-8 bg-sidebar rounded-2xl p-10 border border-border">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/logo-text-large.svg" 
            alt="TELE GNOST" 
            width={288} 
            height={48}
            className="h-12 w-auto"
          />
        </div>
          {/* Header */}
          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="text-2xl font-semibold text-foreground">Welcome back! Please sign in to continue</h1>
            <p className="text-muted-foreground text-sm">Secure access to your medical imaging workspace</p>
          </div>

          {/* Error Display */}
          {error != null && <FormError error={error} className="w-full" />}

          {/* Form */}
          <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="w-full flex flex-col gap-8">
            {/* Email/Username Field - matching Figma Login Input component */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <div 
                className={cn(
                  'flex items-center gap-4 px-4 py-4 rounded-lg bg-secondary border transition-colors',
                  errors.username 
                    ? 'border-destructive' 
                    : dirtyFields.username 
                      ? 'border-primary'
                      : 'border-border'
                )}
              >
                <Mail className="w-6 h-6 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Enter your email"
                  {...form.register('username')}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                />
              </div>
              {errors.username && (
                <span className="text-sm text-destructive">{errors.username.message}</span>
              )}
            </div>

            {/* Password Field - matching Figma Login Input component */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Password
                </label>
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div 
                className={cn(
                  'flex items-center gap-4 px-4 py-4 rounded-lg bg-secondary border transition-colors',
                  errors.password 
                    ? 'border-destructive' 
                    : dirtyFields.password 
                      ? 'border-primary'
                      : 'border-border'
                )}
              >
                <svg className="w-6 h-6 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  {...form.register('password')}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  {showPassword ? (
                    <Eye className="w-6 h-6" />
                  ) : (
                    <EyeOff className="w-6 h-6" />
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="text-sm text-destructive">{errors.password.message}</span>
              )}
            </div>

            {/* Login Button - matching Figma LogonButton component */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className={cn(
                'w-full h-14 rounded-lg font-medium text-lg transition-colors',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90',
                'active:bg-primary/80',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center justify-center gap-2'
              )}
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="flex items-center gap-1 pt-4 border-t border-border w-full justify-center">
            <span className="text-sm text-muted-foreground">Don't have an account?</span>
            <Link to="/register" className="text-sm text-primary hover:text-primary/80 transition-colors">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
