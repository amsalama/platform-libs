# AGENTS.md - CraftCrew Auth Platform v2

## Build/Lint/Test Commands

```bash
# Development
npm run dev              # Start Vite dev server (localhost:3000)

# Build & Check
npm run build            # TypeScript check + Vite production build
npm run type-check       # TypeScript only (no emit)
npm run lint             # ESLint (strict: 0 warnings)
npm run preview          # Preview production build locally

# Testing
npm run test             # Run Vitest
npm run test:coverage    # Run with coverage report
npm run test:ui         # Run Vitest UI (interactive mode)

# Single test execution
npm run test -- users.test.tsx              # Run specific test file
npm run test -t "should login user"          # Run tests matching name pattern
npm run test -t "SSO"                      # Run all SSO-related tests
```

## Code Style Guidelines

### Component & UI Rules

**MANDATORY**: All form inputs must use shadcn/ui components (Input, Label, etc.), never raw HTML inputs.

**MANDATORY**: All primitives (icons, buttons, form elements, etc.) must be imported from established libraries:
- Icons: `lucide-react`
- Form components: `@/components/ui/*` (shadcn/ui based on Radix UI primitives)
- Never create custom primitive components

### TypeScript

```typescript
// Prefer explicit types over 'any'
interface User {
  principal_id: string
  email: string
}

// Use readonly for immutable data
interface UserResponse {
  readonly principal_id: string
  readonly created_at: string
}

// Use discriminated unions for variants
type Principal = AuthenticatedPrincipal | AnonymousPrincipal

// Use utility types
type PartialUser = Partial<User>
type UserDTO = Pick<User, 'email' | 'display_name'>
```

### Component Patterns

```typescript
// Prefer function components with explicit props interfaces
interface Props {
  title: string
  onSave: () => void
}

export const MyComponent: React.FC<Props> = ({ title, onSave }) => {
  return <div>{title}</div>
}
```

### Imports

```typescript
// Organize imports: external libraries → internal components → styles → utilities
import { useState } from 'react'                    // External
import { createBrowserRouter } from 'react-router-dom'  // External
import { Button } from '@/components/ui/button'    // Internal components
import { cn } from '@/lib/utils'                 // Internal utilities
```

### Naming Conventions

```typescript
// Files: kebab-case
auth-store.ts
api-client.ts

// Components: PascalCase
export const MyComponent

// Functions: camelCase
function getUserProfile()

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL
```

### Formatting

```typescript
// 2 space indentation
const users = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]
```

### Error Handling

```typescript
// Always handle API errors with user feedback
try {
  await apiClient.post('/api/v1/roles', data)
} catch (error) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.detail || 'Operation failed'
    useUIStore.getState().addToast({ type: 'error', message })
  }
}
```

## React Best Practices

```typescript
// Use function components with explicit props interfaces
interface Props {
  title: string
  onSave: () => void
}

// Prefer hooks over class components
function MyComponent() {
  const [count, setCount] = useState(0)
  // ... component logic
}

// Memoize expensive calculations
const sortedUsers = useMemo(() => 
  [...users].sort((a, b) => a.email.localeCompare(b.email)),
  [users]
)

// Clean up effects
useEffect(() => {
  // Setup
  return () => {
    // Cleanup
  }
}, [])
```

## TanStack Query Best Practices

```typescript
// Use unique query keys based on params
useQuery({
  queryKey: ['users', { search, status }],
  queryFn: () => fetchUsers({ search, status }),
})

// Implement optimistic updates for mutations
useMutation({
  mutationFn: createUser,
  onMutate: async (newUser) => {
    const previousUsers = queryClient.getQueryData(['users'])
    queryClient.setQueryData(['users'], [...(previousUsers || []), newUser])
  },
})

// Invalidate related queries after mutations
useMutation({
  mutationFn: updateUser,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['users', userId] })
    queryClient.invalidateQueries({ queryKey: ['users'] })
  },
})
```

## shadcn/ui Patterns

```typescript
// Use cn() utility for conditional classes
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class')} />

// Use Radix Dialog for modals (accessible, focus management)
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>Content</DialogContent>
</Dialog>
```

## Form Handling (React Hook Form + Zod)

```typescript
// Define Zod schemas
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email('Invalid email'),
  display_name: z.string().min(1).max(255),
})

type UserFormData = z.infer<typeof userSchema>

// Use useForm hook
const { register, handleSubmit, formState } = useForm<UserFormData>({
  resolver: zodResolver(userSchema),
})
```

## Theme System (next-themes)

```typescript
// Use ThemeProvider from next-themes
import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function App() {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system">
      {/* App content */}
    </NextThemesProvider>
  )
}

// Use useTheme hook
import { useTheme } from 'next-themes'

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return <ActionMenu>
    <ActionMenu.Item onClick={() => setTheme('light')}>Light</ActionMenu.Item>
  </ActionMenu>
}
```

## Authentication Flow

**IMPORTANT**: All authentication must go through backend API endpoints, NOT directly to IdPs (Keycloak, Zitadel, etc.). The IdP configuration is handled by the backend.

### Login Flow

1. User enters email/password on `/login`
2. Frontend calls `POST /api/v1/auth/login` with credentials
3. Backend validates credentials and returns tokens (access_token, refresh_token, id_token)
4. Tokens are stored in sessionStorage
5. User is redirected to authenticated pages

### Token Management

- **Access Token**: Used for authenticated API calls (Authorization header)
- **Refresh Token**: Used to obtain new access tokens before expiry
- **ID Token**: JWT containing user claims (principal info, roles, etc.)

### API Endpoints

- `POST /api/v1/auth/login` - Authenticate with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and invalidate tokens
- `POST /api/v1/auth/introspect` - Validate and decode tokens

## External SSO (Cross-Platform Authentication)

### SSO Flow Overview

External platforms can redirect users to `/sso` with authorization requests. The platform handles:
1. Parse SSO parameters (redirect_uri, client_id, state, response_type, code_challenge)
2. Validate redirect_uri against allowlist (VITE_ALLOWED_REDIRECT_DOMAINS)
3. Generate unique SSO session ID for concurrent flow support
4. Check authentication status (frictionless vs login required)
5. Generate OAuth 2.0 authorization code OR pass current token directly
6. Redirect back to external platform with response

### Response Modes (Configurable via VITE_EXTERNAL_AUTH_RESPONSE_MODE)

#### Mode 1: Authorization Code Flow (Recommended)
- External platform requests `response_type=code`
- Platform generates one-time authorization code (expires in 10 minutes)
- External platform exchanges code for access token (standard OAuth flow)

#### Mode 2: Direct Token Pass (Trusted Partners)
- External platform requests `response_type=token`
- Platform passes current user's access token directly
- Simpler but less secure (token can be replayed)

#### Mode 3: Auto-Detect (Both)
- Platform detects `response_type` from query parameters
- Supports both code and token modes dynamically

### Multiple Concurrent SSO Flows

- Each SSO flow gets unique session ID (e.g., `sso_abc123def456`)
- Isolated sessionStorage per flow: `sso_context_{sessionId}`
- Track active sessions: `active_sso_sessions: ["abc123def456", "xyz789uvw123"]`
- Stale session cleanup after 30 minutes

### Security Requirements

1. **Redirect URI Validation**: Reject requests not in VITE_ALLOWED_REDIRECT_DOMAINS
2. **CSRF Protection**: Always validate `state` parameter against stored SSO sessions
3. **PKCE Support**: If external provides `code_challenge`, generate `code_verifier` (SHA-256)
4. **One-Time Codes**: Authorization codes expire in 10 minutes, single-use only
5. **Session Isolation**: Each concurrent SSO flow gets separate sessionStorage namespace

### Environment Variables

```env
VITE_EXTERNAL_AUTH_ENABLED=true
VITE_EXTERNAL_AUTH_RESPONSE_MODE=code
VITE_ALLOWED_REDIRECT_DOMAINS=app.example.com,admin.example.com,*.acme.com
VITE_SSO_SESSION_TIMEOUT=1800
VITE_SSO_MAX_CONCURRENT=5
```

## Placeholder Pattern for Missing Endpoints

```typescript
// All placeholder endpoints must:
// 1. Throw clear errors pointing to backend team
// 2. Include Jira ticket references if available
// 3. Document expected request/response schemas
// 4. Provide TODO comments with clear expectations
// 5. Implement basic UI that's disabled when endpoint missing
// 6. Add "Not Implemented Yet" banners with clear messaging

// Example:
export async function listUsers(): Promise<User[]> {
  console.error('[PLACEHOLDER] listUsers - waiting for backend endpoint GET /api/v1/users')
  throw new Error(
    'User management endpoints not implemented yet. ' +
    'Please contact backend team to implement GET /api/v1/users. ' +
    'See Jira: BACKEND-001'
  )
}
```

## Project-Specific Technology Stack

- **Framework**: React 18 + TypeScript strict mode + Vite
- **UI Components**: shadcn/ui + Radix UI primitives
- **Data Tables**: TanStack Table (sorting, filtering, pagination)
- **Forms**: React Hook Form + Zod (validation)
- **Server State**: TanStack Query (caching, synchronization)
- **Client State**: Zustand (auth, theme, UI state only)
- **Theme**: next-themes (light/dark/system modes)
- **Icons**: Lucide React (consistent icon set)
- **Router**: React Router v6
- **HTTP Client**: Axios (with interceptors for auth/refresh)
- **API Prefix**: `/api/v1/` (all calls use this prefix)
- **Placeholders**: Throw clear errors (no mock data in production)

## Security & Performance

- Store tokens in sessionStorage (not localStorage)
- Token refresh: 5 minutes before expiry buffer
- Fail-closed authorization: default deny, explicit allow only
- HTTPS only for all API calls
- Never log raw tokens (only fingerprints/timestamps)
- TanStack Query caching: 5-10 minute stale time
- React.memo() for expensive component re-renders
- Lazy load routes with React Router Suspense

## Critical Blocking Issues

1. **User Management**: All user CRUD endpoints missing (blocks Users page)
2. **External Auth**: SSO endpoints needed for cross-platform authentication
