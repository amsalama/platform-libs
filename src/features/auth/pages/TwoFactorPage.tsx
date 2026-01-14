import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Shield } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { apiClient } from '@/services/api/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

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

  const form = useForm<TwoFactorFormData>({
    resolver: zodResolver(twoFactorSchema),
    defaultValues: {
      code: '',
    },
  })

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
      <div className="w-full max-w-md">
        <Card className="rounded-2xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl">Two-Factor Authentication</CardTitle>
            <p className="text-muted-foreground">
              Enter the 6-digit code sent to {email || 'your email'}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-center">Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  {...form.register('code')}
                  className="text-center text-2xl tracking-widest font-mono"
                  disabled={isLoading}
                  autoFocus
                />
                {form.formState.errors.code && (
                  <p className="text-sm text-destructive text-center">{form.formState.errors.code.message}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Verify Code
                  </>
                )}
              </Button>

              <div className="text-center space-y-2 pt-4">
                <p className="text-sm text-muted-foreground">Didn't receive a code?</p>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleResendCode}
                  disabled={isLoading}
                  className="text-primary hover:text-primary/80 p-0 h-auto"
                >
                  Resend Code
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
