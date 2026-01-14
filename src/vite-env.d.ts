interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_IDP_TYPE?: string
  readonly VITE_KEYCLOAK_ISSUER?: string
  readonly VITE_KEYCLOAK_CLIENT_ID?: string
  readonly VITE_KEYCLOAK_REDIRECT_URI?: string
  readonly VITE_KEYCLOAK_AUTHORIZATION_ENDPOINT?: string
  readonly VITE_KEYCLOAK_TOKEN_ENDPOINT?: string
  readonly VITE_KEYCLOAK_LOGOUT_ENDPOINT?: string
  readonly VITE_ZITADEL_ISSUER?: string
  readonly VITE_ZITADEL_CLIENT_ID?: string
  readonly VITE_ZITADEL_REDIRECT_URI?: string
  readonly VITE_ZITADEL_AUTHORIZATION_ENDPOINT?: string
  readonly VITE_ZITADEL_TOKEN_ENDPOINT?: string
  readonly VITE_ZITADEL_LOGOUT_ENDPOINT?: string
  readonly VITE_EXTERNAL_AUTH_ENABLED?: string
  readonly VITE_EXTERNAL_AUTH_RESPONSE_MODE?: string
  readonly VITE_ALLOWED_REDIRECT_DOMAINS?: string
  readonly VITE_SSO_SESSION_TIMEOUT?: string
  readonly VITE_SSO_MAX_CONCURRENT?: string
  readonly VITE_EXTERNAL_CLIENT_MAPPING?: string
  readonly VITE_ENABLE_MOCK_API?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
