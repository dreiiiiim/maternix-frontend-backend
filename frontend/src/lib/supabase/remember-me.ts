import type { CookieOptionsWithName } from '@supabase/ssr'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_COOKIE_MAX_AGE_PERSISTENT = 400 * 24 * 60 * 60
const REMEMBER_ME_COOKIE_MAX_AGE = 365 * 24 * 60 * 60

export const REMEMBER_ME_COOKIE = 'maternix_remember_me'
const REMEMBERED_EMAIL_STORAGE_KEY = 'maternix_remembered_email'
const REMEMBERED_REFRESH_TOKEN_STORAGE_KEY = 'maternix_remembered_refresh_token'

export function parseRememberMeValue(value: string | null | undefined): boolean {
  return value === '1'
}

export function getSupabaseCookieOptions(
  rememberMe: boolean
): CookieOptionsWithName {
  return rememberMe
    ? { maxAge: SUPABASE_COOKIE_MAX_AGE_PERSISTENT }
    : { maxAge: undefined }
}

function getBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const parts = document.cookie.split('; ')
  const match = parts.find((part) => part.startsWith(`${name}=`))
  if (!match) return null
  const value = match.split('=').slice(1).join('=')
  return decodeURIComponent(value)
}

export function getBrowserRememberMePreference(): boolean {
  const cookieValue = getBrowserCookie(REMEMBER_ME_COOKIE)
  if (cookieValue !== null) {
    return parseRememberMeValue(cookieValue)
  }

  if (typeof window !== 'undefined') {
    try {
      return parseRememberMeValue(window.localStorage.getItem(REMEMBER_ME_COOKIE))
    } catch {
      return false
    }
  }

  return false
}

export function setBrowserRememberMePreference(rememberMe: boolean) {
  if (typeof window !== 'undefined') {
    try {
      if (rememberMe) {
        window.localStorage.setItem(REMEMBER_ME_COOKIE, '1')
      } else {
        window.localStorage.removeItem(REMEMBER_ME_COOKIE)
      }
    } catch {
      // Ignore storage failures in restricted browser contexts.
    }
  }

  if (typeof document !== 'undefined') {
    const secure =
      typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? '; Secure'
        : ''

    if (rememberMe) {
      document.cookie = `${REMEMBER_ME_COOKIE}=1; Path=/; Max-Age=${REMEMBER_ME_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
    } else {
      document.cookie = `${REMEMBER_ME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
    }
  }
}

export function getRememberedEmail(): string {
  return getBrowserStorageValue(REMEMBERED_EMAIL_STORAGE_KEY)
}

export function setRememberedEmail(email: string) {
  setBrowserStorageValue(REMEMBERED_EMAIL_STORAGE_KEY, email.trim())
}

function getBrowserStorageValue(key: string): string {
  if (typeof window === 'undefined') return ''
  try {
    return window.localStorage.getItem(key) ?? ''
  } catch {
    return ''
  }
}

function setBrowserStorageValue(key: string, value: string) {
  if (typeof window === 'undefined') return
  try {
    if (value) {
      window.localStorage.setItem(key, value)
    } else {
      window.localStorage.removeItem(key)
    }
  } catch {
    // Ignore storage failures in restricted browser contexts.
  }
}

export function clearRememberedAuthSession() {
  setBrowserStorageValue(REMEMBERED_REFRESH_TOKEN_STORAGE_KEY, '')
}

export function persistRememberedSession(session: Session | null) {
  if (!getBrowserRememberMePreference()) {
    clearRememberedAuthSession()
    return
  }

  const refreshToken = session?.refresh_token?.trim() ?? ''
  if (!refreshToken) return

  setBrowserStorageValue(REMEMBERED_REFRESH_TOKEN_STORAGE_KEY, refreshToken)
}

export async function restoreRememberedSession(
  supabase: SupabaseClient
): Promise<Session | null> {
  if (!getBrowserRememberMePreference()) {
    clearRememberedAuthSession()
    return null
  }

  const refreshToken = getBrowserStorageValue(REMEMBERED_REFRESH_TOKEN_STORAGE_KEY).trim()
  if (!refreshToken) return null

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  })

  if (error || !data.session) {
    clearRememberedAuthSession()
    return null
  }

  persistRememberedSession(data.session)
  return data.session
}

export async function signOutAndClearRememberedSession(supabase: SupabaseClient) {
  clearRememberedAuthSession()
  await supabase.auth.signOut()
}
