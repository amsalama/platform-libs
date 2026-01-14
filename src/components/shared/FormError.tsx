import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { type AxiosError } from 'axios'
import type { HTTPValidationError } from '@/services/api/auth'

interface FormErrorProps {
  error: unknown
  className?: string
}

interface ApiErrorResponse {
  detail?: string | { loc?: (string | number)[]; msg?: string; type?: string }[]
  message?: string
  error?: string
}

export function getFormErrors(error: unknown): Record<string, string> {
  const errors: Record<string, string> = {}
  const axiosError = error as AxiosError<ApiErrorResponse>

  // Handle Axios errors
  if (axiosError?.response?.data) {
    const data = axiosError.response.data

    // Handle 422 validation errors with array of details
    if (axiosError.response.status === 422 && Array.isArray(data.detail)) {
      const validationError = data as HTTPValidationError
      for (const detail of validationError.detail) {
        const field = detail.loc?.slice(-1)?.[0] as string || 'form'
        const fieldName = field.charAt(0).toUpperCase() + field.slice(1)
        errors[field] = `${fieldName}: ${detail.msg}`
      }
      return errors
    }

    // Handle string detail (e.g., {detail: "Invalid credentials"})
    if (typeof data.detail === 'string') {
      errors.form = data.detail
      return errors
    }

    // Handle message field
    if (typeof data.message === 'string') {
      errors.form = data.message
      return errors
    }

    // Handle error field
    if (typeof data.error === 'string') {
      errors.form = data.error
      return errors
    }
  }

  // Handle Axios error message
  if (axiosError?.message && axiosError.message !== 'Network Error') {
    errors.form = axiosError.message
    return errors
  }

  // Handle network errors
  if (axiosError?.message === 'Network Error') {
    errors.form = 'Unable to connect to server. Please check your connection.'
    return errors
  }

  // Handle generic Error objects
  if ((error as Error)?.message) {
    errors.form = (error as Error).message
    return errors
  }

  // Fallback for unknown errors
  if (error) {
    errors.form = 'An unexpected error occurred. Please try again.'
  }

  return errors
}

export function FormError({ error, className }: FormErrorProps) {
  const errors = getFormErrors(error)

  if (Object.keys(errors).length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <div className="space-y-1">
          {Object.entries(errors).map(([field, message]) => (
            <div key={field}>{message}</div>
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}
