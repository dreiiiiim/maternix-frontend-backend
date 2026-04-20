'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  clearRememberedAuthSession,
  getBrowserRememberMePreference,
  persistRememberedSession,
  restoreRememberedSession,
} from '@/lib/supabase/remember-me';

const AUTO_REDIRECT_PATHS = new Set(['/', '/login', '/signup']);

type ProfileRecord = {
  role: 'student' | 'instructor' | 'admin' | null;
  status: 'pending' | 'approved' | 'rejected' | null;
  email_verified: boolean | null;
};

async function getRedirectPathForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<string> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, status, email_verified')
    .eq('id', userId)
    .single<ProfileRecord>();

  if (error || !profile) return '/login';

  if (profile.status === 'pending') return '/pending-approval';
  if (profile.status === 'approved' && !profile.email_verified) return '/pending-verification';

  if (
    profile.status === 'approved' &&
    (profile.role === 'student' || profile.role === 'instructor' || profile.role === 'admin')
  ) {
    return `/${profile.role}/dashboard`;
  }

  return '/login';
}

export function AuthSessionRestorer() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    let isMounted = true;

    const tryRestoreAndRedirect = async () => {
      if (!getBrowserRememberMePreference()) {
        clearRememberedAuthSession();
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      let activeSession = session;

      if (!activeSession) {
        activeSession = await restoreRememberedSession(supabase);
      } else {
        persistRememberedSession(activeSession);
      }

      if (!isMounted || !activeSession) return;
      if (!AUTO_REDIRECT_PATHS.has(pathname)) return;

      const redirectPath = await getRedirectPathForUser(supabase, activeSession.user.id);
      if (!isMounted || redirectPath === pathname) return;
      router.replace(redirectPath);
    };

    tryRestoreAndRedirect();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        clearRememberedAuthSession();
        return;
      }

      if (session) {
        persistRememberedSession(session);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  return null;
}
