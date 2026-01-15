import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, Mail, Eye, EyeOff, User, AtSign, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FormError } from '@/components/shared/FormError'
import { cn } from '@/lib/utils'

const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, underscores, dots, and dashes'),
  email: z.string().email('Invalid email address'),
  first_name: z.string().min(1, 'First name is required').max(100, 'First name must be less than 100 characters'),
  last_name: z.string().max(100, 'Last name must be less than 100 characters').optional(),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
})

type RegisterFormData = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      first_name: '',
      last_name: '',
      password: '',
    },
  })

  const { errors, isSubmitting, dirtyFields } = form.formState

  const handleRegisterSubmit = async (data: RegisterFormData) => {
    setError(null)
    try {
      await register(data.email, data.username, data.first_name, data.last_name || '', data.password)
      setSuccess(true)
    } catch (err) {
      console.error('[RegisterPage] Registration failed', err)
      setError(err)
    }
  }

  // Input field component for consistent styling matching Figma
  const InputField = ({
    label,
    name,
    type = 'text',
    placeholder,
    icon: Icon,
    showToggle,
    onToggle,
    isPassword,
    helpText,
  }: {
    label: string
    name: keyof RegisterFormData
    type?: string
    placeholder: string
    icon: React.ElementType
    showToggle?: boolean
    onToggle?: () => void
    isPassword?: boolean
    helpText?: string
  }) => (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div
        className={cn(
          'flex items-center gap-4 px-4 py-4 rounded-lg bg-secondary border transition-colors',
          errors[name] ? 'border-destructive' : dirtyFields[name] ? 'border-primary' : 'border-border'
        )}
      >
        <Icon className="w-6 h-6 text-muted-foreground shrink-0" />
        <input
          type={type}
          placeholder={placeholder}
          {...form.register(name)}
          disabled={isLoading}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
        />
        {isPassword && (
          <button type="button" onClick={onToggle} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            {showToggle ? <Eye className="w-6 h-6" /> : <EyeOff className="w-6 h-6" />}
          </button>
        )}
      </div>
      {errors[name] && <span className="text-sm text-destructive">{errors[name]?.message}</span>}
      {helpText && !errors[name] && <span className="text-xs text-muted-foreground">{helpText}</span>}
    </div>
  )

  // Lock icon component matching Figma design
  const LockIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          className="fixed inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(/AuthBg.png)`,
          }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 px-8 py-16">
          

          <div className="w-full max-w-4xl flex flex-col items-center gap-8 bg-sidebar rounded-2xl p-12 border border-border">
          <div className="flex flex-col items-center gap-4">
            <img 
              src="/logo-text-large.svg" 
              alt="TELE GNOST" 
              width={288} 
              height={48} 
              className="h-12 w-auto" 
            />
          </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
            
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-foreground">Account Created!</h2>
              <p className="mt-3 text-muted-foreground">
                Your account has been created successfully. You can now sign in with your credentials.
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
                Sign in to continue
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

      <div className="relative z-10 flex flex-col items-center gap-10 px-8 py-10">
        

        <div className="w-full max-w-4xl flex flex-col items-center gap-6 bg-sidebar rounded-2xl p-10 border border-border">
          <div className="flex flex-col items-center gap-4">
            <img 
              src="/logo-text-large.svg" 
              alt="TELEGNOST" 
              width={288} 
              height={48} 
              className="h-12 w-auto" 
            />
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <h1 className="text-2xl font-semibold text-foreground">Create Account</h1>
            <p className="text-muted-foreground text-sm">Sign up to get started with TELE GNOST</p>
          </div>

          {/* Error Display */}
          {error != null && <FormError error={error} className="w-full" />}

          {/* Form */}
          <form onSubmit={form.handleSubmit(handleRegisterSubmit)} className="w-full flex flex-col gap-5">
            {/* Name Row */}
            <div className="grid grid-cols-2 gap-4">
              <InputField label="First Name" name="first_name" placeholder="John" icon={User} />
              <InputField label="Last Name" name="last_name" placeholder="Doe" icon={User} />
            </div>

            {/* Username Field */}
            <InputField
              label="Username"
              name="username"
              placeholder="johndoe"
              icon={AtSign}
              helpText="3-50 characters, letters, numbers, underscores, dots, and dashes only."
            />

            {/* Email Field */}
            <InputField label="Email Address" name="email" type="email" placeholder="john@example.com" icon={Mail} />

            {/* Password Field */}
            <InputField
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              icon={LockIcon}
              isPassword
              showToggle={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              helpText="12+ characters with uppercase, lowercase, number, and special character."
            />

            {/* Register Button - matching Figma LogonButton component */}
            <button
              type="submit"
              disabled={isLoading || isSubmitting}
              className={cn(
                'w-full h-14 rounded-lg font-medium text-lg transition-colors mt-2',
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
                  <span>Creating account...</span>
                </>
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <div className="flex items-center gap-1 pt-4 border-t border-border w-full justify-center">
            <span className="text-sm text-muted-foreground">Already have an account?</span>
            <Link to="/login" className="text-sm text-primary hover:text-primary/80 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
