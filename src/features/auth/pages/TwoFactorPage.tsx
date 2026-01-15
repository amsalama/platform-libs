import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Loader2, Shield, ArrowLeft } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/services/api/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const twoFactorSchema = z.object({
  code: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numbers only'),
})

type TwoFactorFormData = z.infer<typeof twoFactorSchema>

export default function TwoFactorPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const { setSessionFromProfile } = useAuthStore()
  const email = searchParams.get('email') || ''

  // Individual digit refs for the code input boxes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])

  const form = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  })

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Handle digit input
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return // Only allow digits

    const newDigits = [...digits]
    newDigits[index] = value.slice(-1) // Only keep last character
    setDigits(newDigits)

    // Update form value
    const code = newDigits.join('')
    form.setValue('code', code)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newDigits = [...digits]
    for (let i = 0; i < pastedData.length; i++) {
      const char = pastedData[i]
      if (char !== undefined) {
        newDigits[i] = char
      }
    }
    setDigits(newDigits)
    form.setValue('code', newDigits.join(''))

    // Focus appropriate input after paste
    const focusIndex = Math.min(pastedData.length, 5)
    inputRefs.current[focusIndex]?.focus()
  }

  const onSubmit = async (data: TwoFactorFormData) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post('/api/v1/auth/2fa/verify', {
        email,
        code: data.code,
      })

      const tokenResponse = response.data as {
        access_token: string
        refresh_token?: string
        id_token?: string
        expires_in?: number
      }

      // Fetch profile using the newly issued access token
      const meResponse = await apiClient.get('/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${tokenResponse.access_token}`,
        },
      })

      const profile = meResponse.data as {
        principal_id: string
        sub: string
        email?: string | null
        email_verified: boolean
        name?: string | null
        given_name?: string | null
        family_name?: string | null
        preferred_username?: string | null
        tenant_id?: string | null
        roles?: string[]
        permissions?: string[]
        authenticated_at: string
      }

      setSessionFromProfile({
        ...profile,
        roles: profile.roles ?? [],
        permissions: profile.permissions ?? [],
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        id_token: tokenResponse.id_token,
        expires_in: tokenResponse.expires_in,
      })

      navigate('/', { replace: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid code'
      toast.error(message)
      // Clear digits on error
      setDigits(['', '', '', '', '', ''])
      form.setValue('code', '')
      inputRefs.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    try {
      await apiClient.post('/api/v1/auth/2fa/resend', { email })
      toast.success('Verification code resent. Check your email.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend code'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
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
          {/* Header with Shield Icon */}
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold text-foreground">Two-Factor Authentication</h1>
            <p className="text-muted-foreground text-sm text-center">
              Enter the 6-digit code sent to {email || 'your email'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="w-full flex flex-col gap-8">
            {/* Code Input - 6 separate boxes matching Figma Code Input component */}
            <div className="flex flex-col gap-4 w-full items-center">
              <label className="text-sm font-medium text-foreground">Verification Code</label>
              <div className="flex gap-3" onPaste={handlePaste}>
                {digits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={isLoading}
                    className={cn(
                      'w-14 h-14 text-center text-2xl font-semibold rounded-lg',
                      'bg-secondary border border-border',
                      'text-foreground',
                      'focus:border-primary focus:outline-none',
                      'transition-colors',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  />
                ))}
              </div>
              {form.formState.errors.code && (
                <span className="text-sm text-destructive">{form.formState.errors.code.message}</span>
              )}
            </div>

            {/* Verify Button - matching Figma LogonButton component */}
            <button
              type="submit"
              disabled={isLoading || digits.join('').length !== 6}
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
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify Code</span>
              )}
            </button>
          </form>

          {/* Resend Code Link */}
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm text-muted-foreground">Didn't receive a code?</span>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-sm text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
            >
              Resend Code
            </button>
          </div>

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
