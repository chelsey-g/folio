'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ThemeSelector } from '@/components/theme/ThemeSelector';
import { cn } from '@/lib/utils';

interface NavbarProps {
  username: string;
}

export function Navbar({ username }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const NAV_LINKS = [
    { href: '/home',    label: 'Home' },
    { href: '/search',  label: 'Discover' },
    { href: '/shelf',   label: 'My Shelf' },
    ...(username ? [{ href: `/profile/${username}`, label: 'Profile' }] : []),
  ];

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/home') return pathname === '/home';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-md border-b"
      style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
    >
      <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between gap-6">
        <Link
          href="/home"
          className="font-serif text-xl font-bold text-primary tracking-tight shrink-0 hover:text-link transition-colors"
        >
          Folio
        </Link>

        <nav className="flex items-center gap-0.5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive(href)
                  ? 'bg-accent-soft text-link'
                  : 'text-secondary hover:text-primary hover:bg-surface-hover'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <ThemeSelector />
          <button
            onClick={handleSignOut}
            className="text-xs font-medium text-muted hover:text-primary border border-subtle hover:border-default px-3 py-1.5 rounded-lg transition-all"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
