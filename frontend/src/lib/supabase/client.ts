import { createBrowserClient } from '@supabase/ssr'
import {
  getBrowserRememberMePreference,
  getSupabaseCookieOptions,
} from './remember-me'

export function createClient() {
  const rememberMe = getBrowserRememberMePreference()

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(rememberMe),
    }
  )
}
