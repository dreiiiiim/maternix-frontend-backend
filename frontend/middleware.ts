import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware-client'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request })
  const supabase = createMiddlewareClient(request, response)

  // Refresh session token on every request
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  const alwaysPublic = ['/', '/about']
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password']

  if (alwaysPublic.some(p => path === p || path.startsWith(p + '/'))) {
    return response
  }

  // On auth routes: redirect already-logged-in approved users to their dashboard
  if (authRoutes.some(p => path === p || path.startsWith(p + '/'))) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single()

      if (profile?.status === 'approved') {
        return NextResponse.redirect(
          new URL(`/${profile.role}/dashboard`, request.url)
        )
      }
      if (profile?.status === 'pending') {
        return NextResponse.redirect(new URL('/pending-approval', request.url))
      }
    }
    return response
  }

  // All other routes require authentication
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  // Pending-approval page
  if (path.startsWith('/pending-approval')) {
    if (profile?.status === 'approved') {
      return NextResponse.redirect(
        new URL(`/${profile.role}/dashboard`, request.url)
      )
    }
    return response
  }

  // Rejected users can only reach login
  if (profile?.status === 'rejected') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Pending users get redirected to waiting screen
  if (profile?.status === 'pending') {
    return NextResponse.redirect(new URL('/pending-approval', request.url))
  }

  // Role-based route protection
  const rolePrefix: Record<string, string> = {
    student: '/student',
    instructor: '/instructor',
    admin: '/admin',
  }
  const allowed = rolePrefix[profile?.role ?? '']
  if (!allowed || !path.startsWith(allowed)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|api).*)'],
}
