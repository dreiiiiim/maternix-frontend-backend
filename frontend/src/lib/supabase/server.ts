import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  getSupabaseCookieOptions,
  parseRememberMeValue,
  REMEMBER_ME_COOKIE,
} from './remember-me'

export async function createClient() {
  const cookieStore = await cookies()
  const rememberMe = parseRememberMeValue(cookieStore.get(REMEMBER_ME_COOKIE)?.value)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(rememberMe),
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component; middleware handles cookie refresh.
          }
        },
      },
    }
  )
}
