import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function LandingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');

  return (
    <main className="min-h-screen flex flex-col">
      <header
        className="flex items-center justify-between px-8 py-5 border-b backdrop-blur-sm"
        style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
      >
        <span className="font-serif text-2xl font-bold text-primary tracking-tight">Folio</span>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-secondary hover:text-primary transition-colors font-medium">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-btn text-btn-fg px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-md shadow-black/10 font-medium"
          >
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-28">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-link bg-accent-soft border border-accent-soft px-4 py-1.5 rounded-full mb-8 uppercase tracking-wider">
          Your reading life, organized
        </div>
        <h1 className="font-serif text-5xl sm:text-6xl font-bold text-primary leading-[1.1] max-w-2xl mb-6">
          The home for every book you&apos;ve ever loved
        </h1>
        <p className="text-lg text-secondary max-w-lg mb-10 leading-relaxed">
          Track what you read, discover what to read next, and leave your mark on every book.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="bg-btn text-btn-fg px-7 py-3.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-black/10"
          >
            Start for free
          </Link>
          <Link
            href="/login"
            className="bg-surface text-primary border border-subtle px-7 py-3.5 rounded-xl text-sm font-semibold hover:bg-surface-hover hover:border-default transition-all"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-surface" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-16 grid sm:grid-cols-3 gap-6">
          {[
            { icon: '📚', title: 'Three shelves',    body: 'Want to Read, Currently Reading, and Read — always know where you are.',     colorClass: 'bg-amber-500/10 text-amber-500' },
            { icon: '📊', title: 'Track progress',   body: 'Log your current page and see exactly how far through a book you are.',      colorClass: 'bg-blue-500/10 text-blue-400' },
            { icon: '✍️', title: 'Rate & review',    body: 'Leave star ratings and written reviews — build a record of everything read.', colorClass: 'bg-green-500/10 text-green-500' },
          ].map(({ icon, title, body, colorClass }) => (
            <div key={title} className="flex flex-col gap-3 p-6 bg-surface border border-subtle rounded-2xl hover:border-default hover:shadow-md hover:shadow-black/5 transition-all">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${colorClass}`}>
                {icon}
              </div>
              <h3 className="font-serif font-semibold text-primary text-lg">{title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center px-6 py-16 bg-btn">
        <h2 className="font-serif text-3xl font-bold text-btn-fg mb-3">Ready to build your shelf?</h2>
        <p className="text-btn-fg/60 text-sm mb-8">Free forever. No ads. Just books.</p>
        <Link
          href="/signup"
          className="inline-block bg-surface text-primary px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-surface-hover transition-colors"
        >
          Create your account
        </Link>
      </section>
    </main>
  );
}
