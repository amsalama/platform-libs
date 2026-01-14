# CraftCrew Auth Platform - External Authentication Guide

## Overview

The CraftCrew Auth Platform provides centralized authentication services for external applications. External apps can redirect users to this platform for authentication, then receive authorization grants (tokens or authorization codes) to access protected resources.

## Authentication Flows

### 1. Direct Login Flow (Internal Use)

For users directly accessing the auth platform:

```
User → Login Page → Enter Credentials → POST /api/v1/auth/login → Receive Tokens
```

### 2. External SSO Flow (Cross-Platform Authentication)

For external applications that need to authenticate users through this platform:

```
External App → /sso (with params) → User Login → Redirect back with code/token
```

---

## External SSO Integration Guide

### Step 1: Register Your Application

Before integrating, ensure your application's redirect URI is added to the allowed domains:

```env
# In craft-crew-auth-v2 environment
VITE_ALLOWED_REDIRECT_DOMAINS=app.yourcompany.com,admin.yourcompany.com,*.acme.com
```

Wildcard subdomains are supported (e.g., `*.acme.com` matches `app.acme.com`, `dashboard.acme.com`).

### Step 2: Initiate SSO Flow

Redirect users to the auth platform's `/sso` endpoint with the following query parameters:

| Parameter | Required | Description |
|-----------|----------|-------------|
| `redirect_uri` | Yes | URL to redirect back to after authentication (must be in allowlist) |
| `client_id` | Yes | Your application's client identifier |
| `state` | Recommended | Random string for CSRF protection (returned unchanged in redirect) |
| `response_type` | No | `code` (default) or `token` |
| `code_challenge` | No | PKCE code challenge for enhanced security |

**Example Redirect URL:**

```
https://auth.craftcrew.io/sso?
  redirect_uri=https://app.yourcompany.com/auth/callback&
  client_id=your-app-id&
  state=abc123xyz789&
  response_type=code
```

### Step 3: User Authentication

The auth platform handles the user authentication flow:

1. If user is **not authenticated**: Shows login page
2. If user is **already authenticated**: Proceeds to redirect immediately (frictionless SSO)
3. After successful authentication: Redirects back with authorization response

### Step 4: Handle the Callback

Your application receives the user back at your `redirect_uri` with:

#### Authorization Code Flow (`response_type=code`)

```
https://app.yourcompany.com/auth/callback?
  code=<authorization_code>&
  state=abc123xyz789
```

**Exchange the code for tokens:**

```typescript
// POST to the auth platform's token endpoint
const response = await fetch('https://auth.craftcrew.io/api/v1/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'authorization_code',
    code: '<authorization_code>',
    client_id: 'your-app-id',
    redirect_uri: 'https://app.yourcompany.com/auth/callback',
    code_verifier: '<pkce_verifier>' // if using PKCE
  })
});

const tokens = await response.json();
// { access_token, refresh_token, expires_in, token_type }
```

#### Direct Token Flow (`response_type=token`)

```
https://app.yourcompany.com/auth/callback?
  access_token=<jwt_token>&
  token_type=Bearer&
  expires_in=3600&
  state=abc123xyz789
```

**Note:** Direct token flow is less secure and should only be used for trusted first-party applications.

### Step 5: Validate State Parameter

**CRITICAL:** Always validate the `state` parameter matches what you sent:

```typescript
// Before initiating SSO
const state = crypto.randomUUID();
sessionStorage.setItem('oauth_state', state);

// In callback handler
const returnedState = new URL(window.location.href).searchParams.get('state');
const expectedState = sessionStorage.getItem('oauth_state');

if (returnedState !== expectedState) {
  throw new Error('Invalid state parameter - potential CSRF attack');
}
```

---

## Implementation Example (TypeScript/React)

### External App: Auth Module

```typescript
// auth.ts - Authentication utilities for external app

const AUTH_PLATFORM_URL = 'https://auth.craftcrew.io';
const CLIENT_ID = 'your-app-id';
const REDIRECT_URI = `${window.location.origin}/auth/callback`;

/**
 * Initiate SSO flow - redirect user to auth platform
 */
export function initiateSSO(): void {
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);
  
  const ssoUrl = new URL(`${AUTH_PLATFORM_URL}/sso`);
  ssoUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  ssoUrl.searchParams.set('client_id', CLIENT_ID);
  ssoUrl.searchParams.set('state', state);
  ssoUrl.searchParams.set('response_type', 'code');
  
  window.location.href = ssoUrl.toString();
}

/**
 * Handle callback from auth platform
 */
export async function handleCallback(): Promise<{
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}> {
  const params = new URLSearchParams(window.location.search);
  
  // Check for errors
  const error = params.get('error');
  if (error) {
    throw new Error(params.get('error_description') || error);
  }
  
  // Validate state
  const state = params.get('state');
  const expectedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  
  if (state !== expectedState) {
    throw new Error('Invalid state parameter');
  }
  
  // Handle direct token response
  const accessToken = params.get('access_token');
  if (accessToken) {
    return {
      accessToken,
      expiresIn: Number(params.get('expires_in')) || 3600,
    };
  }
  
  // Handle authorization code response
  const code = params.get('code');
  if (!code) {
    throw new Error('No authorization code or token in callback');
  }
  
  // Exchange code for tokens
  const response = await fetch(`${AUTH_PLATFORM_URL}/api/v1/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to exchange authorization code');
  }
  
  return response.json();
}

/**
 * Store tokens securely
 */
export function storeTokens(tokens: {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}): void {
  sessionStorage.setItem('access_token', tokens.accessToken);
  if (tokens.refreshToken) {
    sessionStorage.setItem('refresh_token', tokens.refreshToken);
  }
  sessionStorage.setItem('token_expiry', 
    String(Date.now() + tokens.expiresIn * 1000)
  );
}

/**
 * Get current access token
 */
export function getAccessToken(): string | null {
  const token = sessionStorage.getItem('access_token');
  const expiry = sessionStorage.getItem('token_expiry');
  
  if (!token || !expiry) return null;
  if (Date.now() > Number(expiry)) return null;
  
  return token;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}

/**
 * Logout - clear local tokens
 */
export function logout(): void {
  sessionStorage.removeItem('access_token');
  sessionStorage.removeItem('refresh_token');
  sessionStorage.removeItem('token_expiry');
}
```

### External App: Callback Page Component

```tsx
// CallbackPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleCallback, storeTokens } from './auth';

export function CallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function processCallback() {
      try {
        const tokens = await handleCallback();
        storeTokens(tokens);
        navigate('/', { replace: true });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
      }
    }
    
    processCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="error">
        <h2>Authentication Failed</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Try Again</button>
      </div>
    );
  }

  return <div>Completing authentication...</div>;
}
```

### External App: Login Button Component

```tsx
// LoginButton.tsx
import { initiateSSO, isAuthenticated, logout } from './auth';

export function LoginButton() {
  if (isAuthenticated()) {
    return <button onClick={logout}>Logout</button>;
  }
  
  return <button onClick={initiateSSO}>Sign in with CraftCrew</button>;
}
```

---

## API Reference

### Authentication Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/login` | POST | Direct login with credentials |
| `/api/v1/auth/register` | POST | Register new user |
| `/api/v1/auth/refresh` | POST | Refresh access token |
| `/api/v1/auth/logout` | POST | Revoke refresh token |
| `/api/v1/auth/introspect` | POST | Validate token claims |
| `/api/v1/auth/userinfo` | GET | Get user profile from IdP |
| `/api/v1/auth/me` | GET | Get current user profile |

### SSO Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sso` | GET | Initiate SSO flow (with query params) |
| `/callback` | GET | OAuth callback handler |

### Making Authenticated API Calls

After obtaining tokens, include the access token in all API requests:

```typescript
const response = await fetch('https://api.craftcrew.io/api/v1/protected-resource', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'X-Tenant-ID': tenantId, // Optional: for multi-tenant operations
  },
});
```

---

## Security Considerations

### CSRF Protection

Always use the `state` parameter:
- Generate a cryptographically random string before redirect
- Store it in sessionStorage
- Validate it matches when handling the callback

### Token Storage

- **Recommended:** Use `sessionStorage` (cleared when tab closes)
- **Avoid:** `localStorage` (persists and vulnerable to XSS)
- **Never:** Store tokens in cookies without proper flags

### PKCE (Proof Key for Code Exchange)

For enhanced security, implement PKCE:

```typescript
// Generate code verifier and challenge
const codeVerifier = generateRandomString(128);
const codeChallenge = await sha256(codeVerifier);

// Store verifier for later
sessionStorage.setItem('pkce_verifier', codeVerifier);

// Add to SSO URL
ssoUrl.searchParams.set('code_challenge', codeChallenge);
ssoUrl.searchParams.set('code_challenge_method', 'S256');

// Include in token exchange
body: JSON.stringify({
  ...otherParams,
  code_verifier: sessionStorage.getItem('pkce_verifier'),
})
```

### Allowed Redirect Domains

The auth platform validates redirect URIs against an allowlist:
- Only HTTPS URLs are accepted in production
- Domains must be explicitly configured
- Wildcard subdomains supported with `*.domain.com`

---

## Environment Configuration

### Auth Platform Environment Variables

```env
# Enable external authentication
VITE_EXTERNAL_AUTH_ENABLED=true

# Response mode: 'code' (recommended) or 'token'
VITE_EXTERNAL_AUTH_RESPONSE_MODE=code

# Allowed redirect domains (comma-separated)
VITE_ALLOWED_REDIRECT_DOMAINS=app.example.com,admin.example.com,*.acme.com

# SSO session timeout in seconds (default: 1800 = 30 minutes)
VITE_SSO_SESSION_TIMEOUT=1800

# Maximum concurrent SSO sessions per browser (default: 5)
VITE_SSO_MAX_CONCURRENT=5
```

---

## Troubleshooting

### "Redirect URI not in allowlist"

Ensure your redirect domain is configured in `VITE_ALLOWED_REDIRECT_DOMAINS`.

### "Invalid state parameter"

- State wasn't stored before redirect
- State was stored in different tab/browser
- Session storage was cleared

### "Missing required parameters"

Ensure both `redirect_uri` and `client_id` are provided in the SSO URL.

### Token Expired

Implement token refresh logic:

```typescript
const refreshToken = sessionStorage.getItem('refresh_token');
const response = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refresh_token: refreshToken }),
});
const newTokens = await response.json();
```

---

## Flow Diagrams

### Authorization Code Flow

```
┌──────────────┐    1. Redirect to /sso     ┌──────────────────┐
│              │ ─────────────────────────► │                  │
│   External   │                            │   CraftCrew      │
│   App        │    4. Redirect with code   │   Auth Platform  │
│              │ ◄───────────────────────── │                  │
└──────────────┘                            └──────────────────┘
       │                                            │
       │                                            │
       │ 5. Exchange code                   2. User │
       │    for tokens                        Login │
       │                                            │
       ▼                                            ▼
┌──────────────┐                            ┌──────────────────┐
│   Token      │ ◄──────────────────────────│   Login Page     │
│   Endpoint   │    3. Authenticate         │                  │
└──────────────┘                            └──────────────────┘
```

### Session Flow (Already Authenticated)

```
┌──────────────┐    1. Redirect to /sso     ┌──────────────────┐
│              │ ─────────────────────────► │                  │
│   External   │                            │   CraftCrew      │
│   App        │    2. Immediate redirect   │   Auth Platform  │
│              │ ◄───────────────────────── │   (Frictionless) │
└──────────────┘       with code/token      └──────────────────┘
```

---

## Support

For integration support or to register your application:
- Contact: platform-team@craftcrew.io
- Documentation: https://docs.craftcrew.io/auth
