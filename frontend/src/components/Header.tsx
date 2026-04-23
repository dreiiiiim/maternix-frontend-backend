'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function Header() {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isDashboardPage =
    pathname.startsWith('/student') ||
    pathname.startsWith('/instructor') ||
    pathname.startsWith('/admin');

  if (isAuthPage || isDashboardPage) return null;

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="sticky top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border"

    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/LOGO-removebg-preview.png"
            alt="Maternix Track"
            width={64}
            height={64}
            className="h-16 w-16"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = document.createElement('span');
              fallback.className = 'text-xl font-bold';
              fallback.style.color = 'var(--brand-pink-dark)';
              fallback.textContent = 'Maternix';
              target.parentNode?.appendChild(fallback);
            }}
          />
        </Link>

        <div className="flex items-center gap-6">
          {pathname !== '/about' && (
            <Link
              href="/about"
              className="px-5 py-2.5 text-foreground transition-colors hover:text-[var(--brand-green-dark)]"
            >
              About Us
            </Link>
          )}

          {pathname === '/about' && (
            <Link
              href="/"
              className="px-5 py-2.5 text-foreground transition-colors hover:text-[var(--brand-green-dark)]"
            >
              Home
            </Link>
          )}

          <Link
            href="/login"
            className="px-5 py-2.5 text-foreground transition-colors hover:text-[var(--brand-green-dark)]"
          >
            Login
          </Link>

          <Link
            href="/signup"
            className="px-6 py-2.5 text-white rounded-lg transition-all hover:scale-105"
            style={{ backgroundColor: 'var(--brand-pink-dark)' }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--brand-green-dark)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--brand-pink-dark)')
            }
          >
            Sign Up
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
