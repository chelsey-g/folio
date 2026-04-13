import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');

  // Decorative book spines — purely visual
  const spines = [
    { h: 72,  c: '#C4A882' }, { h: 88,  c: '#1A1614' }, { h: 64,  c: '#A0470A' },
    { h: 96,  c: '#6B5344' }, { h: 80,  c: '#D4C9B8' }, { h: 108, c: '#1A1614' },
    { h: 68,  c: '#A0470A' }, { h: 84,  c: '#8B7355' }, { h: 92,  c: '#C4A882' },
    { h: 76,  c: '#1A1614' }, { h: 100, c: '#6B5344' }, { h: 72,  c: '#D4C9B8' },
    { h: 88,  c: '#A0470A' }, { h: 64,  c: '#1A1614' }, { h: 96,  c: '#8B7355' },
    { h: 80,  c: '#C4A882' }, { h: 104, c: '#6B5344' }, { h: 68,  c: '#1A1614' },
    { h: 88,  c: '#A0470A' }, { h: 76,  c: '#D4C9B8' },
  ];

  return (
    <main className="min-h-screen flex flex-col bg-[var(--bg)]">

      {/* ── Nav ─────────────────────────────────────── */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)', backdropFilter: 'blur(12px)' }}
      >
        <span className="font-serif text-2xl font-bold text-primary tracking-tight">Folio</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-secondary hover:text-primary transition-colors font-medium">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-btn text-btn-fg px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm font-medium"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 pb-0 relative overflow-hidden">

        {/* Ambient glow */}
        <div
          className="absolute inset-x-0 top-0 h-80 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, var(--accent-bg), transparent)' }}
        />

        <div className="relative z-10 max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-link tracking-[0.2em] uppercase mb-8 animate-in">
            Your reading life, organised
          </p>

          <h1
            className="font-serif font-bold text-primary leading-[0.92] tracking-tight mb-8 animate-in delay-1"
            style={{ fontSize: 'clamp(3.5rem, 10vw, 7.5rem)' }}
          >
            The home for<br />
            <em className="not-italic" style={{ color: 'var(--link)' }}>every book</em><br />
            you&apos;ve ever<br />
            loved.
          </h1>

          <p className="text-lg text-secondary max-w-md mx-auto mb-10 leading-relaxed animate-in delay-2">
            Track what you read, discover what&apos;s next,
            and leave your mark on every book.
          </p>

          <div className="flex items-center justify-center gap-3 animate-in delay-3">
            <Link
              href="/signup"
              className="bg-btn text-btn-fg px-8 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-black/10"
            >
              Start for free
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-secondary hover:text-primary transition-colors px-4 py-3.5"
            >
              Sign in →
            </Link>
          </div>
        </div>

        {/* Decorative shelf */}
        <div className="relative z-10 w-full max-w-lg mx-auto mt-16 animate-in delay-4">
          <div className="flex items-end justify-center gap-[3px]" style={{ height: '120px' }}>
            {spines.map((s, i) => (
              <div
                key={i}
                className="rounded-t-[2px] opacity-70 flex-shrink-0"
                style={{ height: `${s.h}px`, width: '14px', backgroundColor: s.c }}
              />
            ))}
          </div>
          {/* Shelf plank */}
          <div className="h-2 rounded-sm w-full" style={{ backgroundColor: 'var(--border-strong)' }} />
          <div className="h-px w-full mt-0.5 opacity-30" style={{ backgroundColor: 'var(--border-strong)' }} />
        </div>
      </section>

      {/* ── Vibe Search callout ───────────────────────── */}
      <section className="border-t mt-16" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center gap-10">
          {/* Text */}
          <div className="flex-1 max-w-sm">
            <p className="text-xs font-semibold text-link tracking-[0.18em] uppercase mb-4">✦ Vibe Search</p>
            <h2 className="font-serif text-3xl font-bold text-primary leading-tight mb-4">
              Find your next read by feeling, not title.
            </h2>
            <p className="text-secondary text-sm leading-relaxed">
              Describe the mood you&apos;re after — &ldquo;a quiet novel about grief in Scandinavia&rdquo; or
              &ldquo;fast-paced thriller with an unreliable narrator&rdquo; — and get ten
              handpicked recommendations from AI that knows your taste.
            </p>
          </div>

          {/* Mock vibe card */}
          <div className="flex-1 w-full max-w-sm">
            <div className="bg-surface border border-subtle rounded-2xl p-4 shadow-md shadow-black/8 space-y-3">
              {/* Mock search bar */}
              <div className="flex items-center gap-2 px-3 py-2 bg-input border border-input rounded-xl text-sm text-muted">
                <span className="text-xs opacity-60">✦</span>
                <span className="truncate">slow-burn literary fiction set in rural Japan</span>
              </div>
              {/* Mock results */}
              {[
                { title: 'The Sound of Waves', author: 'Yukio Mishima', genre: 'Literary Fiction' },
                { title: 'A Wild Sheep Chase', author: 'Haruki Murakami', genre: 'Magical Realism' },
                { title: 'Snow Country',       author: 'Yasunari Kawabata', genre: 'Literary Fiction' },
              ].map((b, i) => (
                <div key={b.title} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover transition-colors">
                  <span className="text-xs text-muted tabular-nums w-4 shrink-0">{i + 1}</span>
                  <div
                    className="w-8 h-12 rounded-sm shrink-0 opacity-80"
                    style={{ background: ['#C4A882', '#6B5344', '#1A1614'][i] }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary line-clamp-1">{b.title}</p>
                    <p className="text-xs text-muted italic">{b.author}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 bg-accent-soft text-link rounded-full border border-[var(--link)]/20 mt-0.5 inline-block">
                      {b.genre}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[var(--border)]">
          {[
            {
              n: '01',
              title: 'Three shelves',
              body:  'Want to Read, Currently Reading, and Read — always know exactly where you are with every book.',
            },
            {
              n: '02',
              title: 'Track progress',
              body:  'Log your current page from the home screen and watch your progress bar fill up in real time.',
            },
            {
              n: '03',
              title: 'Rate & review',
              body:  'Leave star ratings and written reviews — build a permanent record of everything you&apos;ve read.',
            },
            {
              n: '04',
              title: 'Vibe Search',
              body:  'Describe a feeling, not a title. AI recommends books tailored to your taste and reading history.',
            },
          ].map(({ n, title, body }) => (
            <div key={n} className="flex flex-col gap-4 p-8" style={{ backgroundColor: 'var(--bg)' }}>
              <span className="font-serif text-4xl font-bold opacity-10 text-primary leading-none">{n}</span>
              <h3 className="font-serif font-semibold text-primary text-lg leading-snug">{title}</h3>
              <p className="text-sm text-secondary leading-relaxed" dangerouslySetInnerHTML={{ __html: body }} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ───────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-3 gap-8 text-center">
          {[
            { value: 'Free',     label: 'Always' },
            { value: 'No ads',   label: 'Ever' },
            { value: 'Just',     label: 'books' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="font-serif text-3xl font-bold text-primary">{value}</p>
              <p className="text-sm text-muted mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────── */}
      <section className="border-t" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--btn)' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--btn-text)' }}>
              Ready to build your shelf?
            </h2>
            <p className="text-sm opacity-50" style={{ color: 'var(--btn-text)' }}>
              Free forever. No ads. Just books.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 bg-[var(--bg)] text-[var(--text-1)] px-8 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg"
          >
            Create your account
          </Link>
        </div>
      </section>

    </main>
  );
}
