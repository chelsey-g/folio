'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: string;
  message: string;
  book_title: string | null;
  finished_book_id: string | null;
  recommended_book_id: string | null;
  created_at: string;
}

interface NavbarProps {
  username: string;
}

const THEMES: { id: Theme; name: string; bg: string; accent: string }[] = [
  { id: 'parchment', name: 'Parchment', bg: '#F7F3EC', accent: '#CB6B1A' },
  { id: 'midnight',  name: 'Midnight',  bg: '#0F0F18', accent: '#7C72F5' },
  { id: 'forest',    name: 'Forest',    bg: '#0B1A0E', accent: '#22C55E' },
  { id: 'rose',      name: 'Rose',      bg: '#FDF4F6', accent: '#E11D48' },
];

const UserIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6.5" cy="4" r="2.5" />
    <path d="M1 12c0-3.038 2.462-5.5 5.5-5.5S12 8.962 12 12" />
  </svg>
);

const EditIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5z" />
  </svg>
);

const BellIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 1.5A4.5 4.5 0 003.5 6v2.5L2 10.5h12L12.5 8.5V6A4.5 4.5 0 008 1.5z" />
    <path d="M6.5 12.5a1.5 1.5 0 003 0" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 2H2.5A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11H5" />
    <path d="M8.5 9.5L12 6.5l-3.5-3" />
    <line x1="12" y1="6.5" x2="5" y2="6.5" />
  </svg>
);

// Bottom nav icons
const HomeIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={filled ? 'currentColor' : 'none'} />
    <path d="M8 20v-8h6v8" stroke="currentColor" />
  </svg>
);

const DiscoverIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="10" cy="10" r="7" fill={filled ? 'currentColor' : 'none'} fillOpacity={filled ? 0.15 : 0} />
    <circle cx="10" cy="10" r="7" />
    <line x1="15.5" y1="15.5" x2="20" y2="20" />
    {filled && <circle cx="10" cy="10" r="3" fill="currentColor" />}
  </svg>
);

const ShelfIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="4" height="14" rx="1" fill={filled ? 'currentColor' : 'none'} />
    <rect x="9" y="6" width="4" height="12" rx="1" fill={filled ? 'currentColor' : 'none'} />
    <rect x="15" y="3" width="4" height="15" rx="1" fill={filled ? 'currentColor' : 'none'} />
    <line x1="2" y1="19" x2="20" y2="19" />
  </svg>
);

const StatsIcon = ({ filled }: { filled?: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3"  y="12" width="4" height="7" rx="1" fill={filled ? 'currentColor' : 'none'} />
    <rect x="9"  y="7"  width="4" height="12" rx="1" fill={filled ? 'currentColor' : 'none'} />
    <rect x="15" y="3"  width="4" height="16" rx="1" fill={filled ? 'currentColor' : 'none'} />
  </svg>
);

const BOTTOM_NAV = [
  { href: '/home',   label: 'Home',     Icon: HomeIcon     },
  { href: '/search', label: 'Discover', Icon: DiscoverIcon },
  { href: '/shelf',  label: 'Shelf',    Icon: ShelfIcon    },
  { href: '/stats',  label: 'Stats',    Icon: StatsIcon    },
];

export function Navbar({ username }: NavbarProps) {
  const pathname = usePathname();
  const router   = useRouter();
  const { theme, setTheme } = useTheme();
  const [open, setOpen]           = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs]       = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);

  const DESKTOP_NAV = [
    { href: '/home',   label: 'Home'     },
    { href: '/search', label: 'Discover' },
    { href: '/shelf',  label: 'My Shelf' },
    { href: '/stats',  label: 'Stats'    },
  ];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('notifications')
      .select('id, type, message, book_title, finished_book_id, recommended_book_id, created_at')
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setNotifs((data as Notification[]) ?? []));
  }, []);

  async function dismissNotif(id: string) {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    await fetch(`/api/notifications/${id}/dismiss`, { method: 'POST' });
  }

  async function handleSignOut() {
    setOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  function isActive(href: string) {
    if (href === '/home') return pathname === '/home';
    return pathname === href || pathname.startsWith(href + '/');
  }

  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <>
      {/* ── Top bar ──────────────────────────────────── */}
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

          {/* Desktop nav links */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {DESKTOP_NAV.map(({ href, label }) => (
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

          {/* Right side: notifications + user menu */}
          <div className="flex items-center gap-1 shrink-0">

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              aria-label="Notifications"
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 relative',
                notifOpen
                  ? 'bg-accent-soft text-link'
                  : 'text-secondary hover:text-primary hover:bg-surface-hover'
              )}
            >
              <BellIcon />
              {notifs.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[var(--link)]" />
              )}
            </button>

            {notifOpen && (
              <div
                className="absolute right-0 top-11 z-50 w-80 bg-surface border border-subtle rounded-2xl shadow-xl shadow-black/15 overflow-hidden"
                style={{ backdropFilter: 'blur(16px)' }}
              >
                <div className="px-4 py-3 border-b border-subtle flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted uppercase tracking-widest">Notifications</p>
                  {notifs.length > 0 && (
                    <span className="text-xs text-muted">{notifs.length} unread</span>
                  )}
                </div>

                {notifs.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <p className="text-sm text-muted">No recommendations yet</p>
                    <p className="text-xs text-muted opacity-60 mt-1">Finish a book to get one</p>
                  </div>
                ) : (
                  <>
                    <ul className="divide-y divide-[var(--border)]">
                      {notifs.map((n) => (
                        <li key={n.id} className="px-4 py-3 flex gap-3 items-center group">
                          <span className="text-[var(--link)] text-xs shrink-0">✦</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-primary font-medium leading-snug">
                              {n.type === 'reading_pace' ? 'Reading pace check-in' : 'New recommendation'}
                            </p>
                            <p className="text-xs text-muted truncate mt-0.5">
                              {n.type === 'reading_pace'
                                ? n.message
                                : `Read next: ${n.book_title ?? 'a book you might love'}`}
                            </p>
                          </div>
                          <button
                            onClick={() => dismissNotif(n.id)}
                            aria-label="Dismiss"
                            className="text-muted hover:text-primary transition-colors text-base leading-none opacity-0 group-hover:opacity-100 shrink-0"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-subtle p-2">
                      <Link
                        href="/recommendations"
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-semibold text-link hover:bg-accent-soft transition-colors"
                      >
                        View all recommendations →
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Account menu"
              className={cn(
                'w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-sm font-bold text-white shadow-sm transition-all duration-150',
                open
                  ? 'ring-2 ring-[var(--link)] ring-offset-1 ring-offset-[var(--nav-bg)] opacity-90'
                  : 'hover:opacity-90 hover:ring-2 hover:ring-[var(--border-strong)] hover:ring-offset-1 hover:ring-offset-[var(--nav-bg)]'
              )}
            >
              {initial}
            </button>

            {open && (
              <div
                className="absolute right-0 top-11 z-50 w-52 bg-surface border border-subtle rounded-2xl shadow-xl shadow-black/15 overflow-hidden"
                style={{ backdropFilter: 'blur(16px)' }}
              >
                {/* Identity */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-subtle">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary truncate leading-none">
                      {username}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">@{username}</p>
                  </div>
                </div>

                {/* Profile links */}
                <div className="p-1.5">
                  <Link
                    href={`/profile/${username}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
                  >
                    <span className="text-muted"><UserIcon /></span>
                    View profile
                  </Link>
                  <Link
                    href="/profile/edit"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-primary hover:bg-surface-hover transition-colors"
                  >
                    <span className="text-muted"><EditIcon /></span>
                    Edit profile
                  </Link>
                </div>

                {/* Theme picker */}
                <div className="border-t border-subtle p-1.5">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 pt-1.5 pb-2">
                    Theme
                  </p>
                  <div className="grid grid-cols-2 gap-1 px-0.5">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        className={cn(
                          'flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 text-left',
                          theme === t.id
                            ? 'bg-accent-soft text-link'
                            : 'text-muted hover:text-secondary hover:bg-surface-hover'
                        )}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 ring-1 ring-[var(--border)]"
                          style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)` }}
                        />
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sign out */}
                <div className="border-t border-subtle p-1.5">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-secondary hover:text-red-400 hover:bg-red-500/8 transition-colors text-left"
                  >
                    <span><SignOutIcon /></span>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
          </div> {/* end right side wrapper */}
        </div>
      </header>

      {/* ── Mobile bottom tab bar ─────────────────────── */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 z-50 border-t flex"
        style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)', backdropFilter: 'blur(16px)', paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {BOTTOM_NAV.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 transition-colors"
              style={{ color: active ? 'var(--link)' : 'var(--text-3)' }}
            >
              <Icon filled={active} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
