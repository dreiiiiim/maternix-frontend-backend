import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'
import {
  getSupabaseCookieOptions,
  parseRememberMeValue,
  REMEMBER_ME_COOKIE,
} from './remember-me'

export function createMiddlewareClient(request: NextRequest, response: NextResponse) {
  const rememberMe = parseRememberMeValue(request.cookies.get(REMEMBER_ME_COOKIE)?.value)

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: getSupabaseCookieOptions(rememberMe),
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value)
          })
        },
      },
    }
  )
}
