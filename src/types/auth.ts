/**
 * Authentication Types
 * Based on SPEC-SL-FOUND-002 and api-spec.md
 */

/**
 * Actor types for authenticated principals
 */
export type ActorType = 'USER' | 'SERVICE' | 'API_KEY' | 'SYSTEM'

/**
 * Authentication methods
 */
export type AuthenticationMethod =
  | 'PASSWORD'
  | 'SSO'
  | 'MFA'
  | 'CLIENT_CREDENTIALS'
  | 'API_KEY'
  | 'REFRESH_TOKEN'
  | 'IMPERSONATION'
  | 'SYSTEM_INTERNAL'

/**
 * IdP provider types (informative only)
 */
export type ProviderType = 'KEYCLOAK' | 'AUTH0' | 'ZITADEL' | 'OKTA' | 'GENERIC_OIDC'

/**
 * Auth source - IdP provenance
 */
export interface AuthSource {
  idp_issuer: string
  idp_subject: string
  provider_type: ProviderType
}

/**
 * Tenant hints from token (not validated)
 */
export interface TenantHints {
  tenant_id?: string
  organization_id?: string
  tenant_roles?: string[]
}

/**
 * Impersonation context
 */
export interface ImpersonationContext {
  impersonator_principal_id: string
  impersonated_principal_id: string
  reason?: string
  started_at?: string
}

/**
 * Custom claims (IdP-specific)
 */
export interface CustomClaims {
  [key: string]: string | number | boolean | (string | number | boolean)[] | null
}

/**
 * Authenticated principal
 * Platform-generated UUID principal_id (per ADR-SEC-002)
 */
export interface AuthenticatedPrincipal {
  principal_id: string // Platform-generated UUID (internal only)
  actor_type: ActorType
  authentication_method: AuthenticationMethod
  auth_source?: AuthSource // Required for IdP-based auth, absent for API_KEY/SYSTEM
  authentication_time: string // ISO 8601 timestamp
  token_expiry?: string // ISO 8601 timestamp (absent for API_KEY/SYSTEM)
  session_id?: string // Session ID from token
  email?: string
  email_verified?: boolean
  display_name?: string
  roles?: string[] // Roles from realm_access or custom claims
  tenant_hints?: TenantHints
  custom_claims?: CustomClaims
  scopes?: string[]
  operation_id?: string // Required for SYSTEM
  api_key_id?: string // Required for API_KEY
  impersonation?: ImpersonationContext // Required for IMPERSONATION
}

/**
 * Anonymous principal
 */
export interface AnonymousPrincipal {
  actor_type: 'ANONYMOUS'
  is_anonymous: true
  request_fingerprint?: string
}

/**
 * User data from login API response (direct from API, not from JWT parsing)
 */
export interface User {
  readonly principal_id: string
  readonly email: string
  readonly email_verified: boolean
  readonly name: string
  readonly given_name: string
  readonly family_name: string
  readonly preferred_username: string
  readonly tenant_id: string | null
  readonly roles: string[]
  readonly permissions: string[]
  readonly authenticated_at: string
}

/**
 * Principal union type
 */
export type Principal = AuthenticatedPrincipal | AnonymousPrincipal
