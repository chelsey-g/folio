import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookCard } from '@/components/books/BookCard';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { BookCover } from '@/components/books/BookCover';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatAuthors } from '@/lib/utils';
import type { UserBook } from '@/types';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { data: userBooks }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_books').select('*, book:books(*)')
      .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(30),
  ]);

  const books    = (userBooks ?? []) as UserBook[];
  const reading  = books.filter((b) => b.shelf === 'reading');
  const booksRead  = books.filter((b) => b.shelf === 'read').length;
  const wantToRead = books.filter((b) => b.shelf === 'want_to_read').length;
  const recent   = books.filter((b) => b.shelf !== 'reading').slice(0, 6);

  const rated    = books.filter((b) => b.rating);
  const avgRating = rated.length > 0
    ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
    : null;

  const name = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there';

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Header */}
      <section>
        <p className="text-xs font-medium text-muted uppercase tracking-widest mb-1">
          {getGreeting()}
        </p>
        <h1 className="font-serif text-3xl font-bold text-primary mb-6">{name}</h1>
        <ProfileStats
          booksRead={booksRead}
          booksReading={reading.length}
          wantToRead={wantToRead}
          avgRating={avgRating}
        />
      </section>

      {/* Currently Reading */}
      {reading.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Currently reading</h2>
          <div className="space-y-3">
            {reading.map((ub) => {
              if (!ub.book) return null;
              const pageCount   = ub.book.page_count;
              const currentPage = ub.current_page ?? 0;
              const progress    = pageCount && pageCount > 0
                ? Math.min(100, Math.round((currentPage / pageCount) * 100))
                : null;

              return (
                <Link
                  key={ub.id}
                  href={`/books/${ub.book.id}`}
                  className="flex gap-5 p-5 bg-surface border border-subtle rounded-2xl shadow-sm shadow-black/5 hover:border-default hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex-shrink-0 shadow-lg shadow-black/20 rounded-sm group-hover:shadow-xl group-hover:-translate-y-0.5 transition-all duration-200">
                    <BookCover coverUrl={ub.book.cover_url} title={ub.book.title} width={64} height={96} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-primary text-sm leading-snug line-clamp-2 group-hover:text-link transition-colors">
                      {ub.book.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 mb-3">{formatAuthors(ub.book.authors)}</p>
                    {progress !== null ? (
                      <div className="space-y-1.5">
                        <ProgressBar value={progress} />
                        <p className="text-xs text-muted">{progress}% · {currentPage} of {pageCount} pages</p>
                      </div>
                    ) : (
                      <p className="text-xs text-muted italic opacity-60">No progress logged yet</p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent Activity */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-primary">Recent activity</h2>
            <Link href="/shelf" className="text-xs font-medium text-muted hover:text-link transition-colors">
              View all →
            </Link>
          </div>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {recent.map((ub) =>
              ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} compact /> : null
            )}
          </div>
        </section>
      )}

      {books.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            📖
          </div>
          <h2 className="font-serif text-xl font-semibold text-primary mb-2">
            Your reading journey starts here
          </h2>
          <p className="text-sm text-muted mb-6">Search for a book you love and add it to your shelf.</p>
          <Link
            href="/search"
            className="inline-block bg-btn text-btn-fg px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shadow-md shadow-black/10"
          >
            Discover books
          </Link>
        </div>
      )}
    </div>
  );
}
