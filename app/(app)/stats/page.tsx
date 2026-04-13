import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookCover } from '@/components/books/BookCover';
import { StarRating } from '@/components/ui/StarRating';
import type { UserBook } from '@/types';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getBookYear(ub: UserBook): number | null {
  return ub.finished_at ? new Date(ub.finished_at).getFullYear() : null;
}

function getBookMonth(ub: UserBook): number | null {
  return ub.finished_at ? new Date(ub.finished_at).getMonth() : null;
}

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_books').select('*, book:books(*)')
    .eq('user_id', user.id);

  const all      = (data ?? []) as UserBook[];
  const readAll  = all.filter((b) => b.shelf === 'read');
  const year     = new Date().getFullYear();
  const readYear = readAll.filter((b) => getBookYear(b) === year);

  // Books by month (this year)
  const byMonth = Array.from({ length: 12 }, (_, i) => ({
    label: MONTHS[i],
    count: readYear.filter((b) => getBookMonth(b) === i && getBookMonth(b) !== null).length,
  }));
  const maxMonth = Math.max(...byMonth.map((m) => m.count), 1);

  // Top genres
  const genreMap: Record<string, number> = {};
  readAll.forEach((ub) => {
    const g = ub.book?.categories?.[0];
    if (g) genreMap[g] = (genreMap[g] ?? 0) + 1;
  });
  const topGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxGenre = Math.max(...topGenres.map((g) => g[1]), 1);

  // Top authors
  const authorMap: Record<string, number> = {};
  readAll.forEach((ub) => {
    const a = ub.book?.authors?.[0];
    if (a) authorMap[a] = (authorMap[a] ?? 0) + 1;
  });
  const topAuthors = Object.entries(authorMap)
    .sort((a, b) => b[1] - a[1])
    .filter(([, n]) => n > 1)
    .slice(0, 5);

  // Total pages
  const totalPages = readAll.reduce((s, ub) => s + (ub.book?.page_count ?? 0), 0);

  // Avg rating
  const rated     = all.filter((b) => b.rating);
  const avgRating = rated.length > 0
    ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
    : null;

  // Highest rated books this year
  const bestRated = readYear
    .filter((b) => (b.rating ?? 0) >= 4 && b.book)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 8);

  // Longest read
  const withPages = readAll.filter((b) => b.book?.page_count);
  const longest   = withPages.sort((a, b) => (b.book?.page_count ?? 0) - (a.book?.page_count ?? 0))[0];

  if (readAll.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 animate-in">
        <p className="text-4xl mb-4 opacity-30">📊</p>
        <h1 className="font-serif text-2xl font-bold text-primary mb-2">No stats yet</h1>
        <p className="text-sm text-muted mb-6">Finish some books and your reading stats will appear here.</p>
        <Link href="/search" className="inline-block bg-btn text-btn-fg px-5 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
          Discover books
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">

      {/* Header */}
      <div className="animate-in">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Reading stats</p>
        <h1 className="font-serif text-4xl font-bold text-primary">{year}</h1>
      </div>

      {/* Hero numbers */}
      <div className="grid grid-cols-3 gap-3 animate-in delay-1">
        {[
          { value: readYear.length, label: `Books in ${year}`,   sub: `${readAll.length} all time` },
          { value: totalPages > 0 ? totalPages.toLocaleString() : '—', label: 'Pages read', sub: 'all time' },
          { value: avgRating ? avgRating.toFixed(1) : '—', label: 'Avg rating', sub: `${rated.length} rated`, suffix: avgRating ? ' ★' : '' },
        ].map(({ value, label, sub, suffix = '' }) => (
          <div key={label} className="bg-surface border border-subtle rounded-2xl p-5 shadow-sm shadow-black/5 text-center">
            <p className="text-3xl font-bold text-primary tabular-nums leading-none">
              {value}<span className="text-xl text-link">{suffix}</span>
            </p>
            <p className="text-xs font-semibold text-primary mt-2">{label}</p>
            <p className="text-xs text-muted mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Books by month */}
      {readYear.length > 0 && (
        <section className="animate-in delay-2">
          <h2 className="font-serif text-lg font-semibold text-primary mb-5">Books by month</h2>
          <div className="bg-surface border border-subtle rounded-2xl p-6 shadow-sm shadow-black/5">
            <div className="space-y-2.5">
              {byMonth.map(({ label, count }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="text-xs text-muted w-7 shrink-0 tabular-nums">{label}</span>
                  <div className="flex-1 h-5 bg-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: count > 0 ? `${Math.round((count / maxMonth) * 100)}%` : '0%',
                        backgroundColor: 'var(--link)',
                        minWidth: count > 0 ? '8px' : '0',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-primary w-4 text-right tabular-nums shrink-0">
                    {count || ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Top genres */}
      {topGenres.length > 0 && (
        <section className="animate-in delay-3">
          <h2 className="font-serif text-lg font-semibold text-primary mb-5">Top genres</h2>
          <div className="bg-surface border border-subtle rounded-2xl p-6 shadow-sm shadow-black/5 space-y-3">
            {topGenres.map(([genre, count]) => (
              <div key={genre} className="flex items-center gap-3">
                <span className="text-sm text-primary font-medium w-36 shrink-0 truncate">{genre}</span>
                <div className="flex-1 h-2 bg-surface-hover rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((count / maxGenre) * 100)}%`,
                      backgroundColor: 'var(--link)',
                      opacity: 0.7,
                    }}
                  />
                </div>
                <span className="text-xs text-muted w-4 text-right tabular-nums shrink-0">{count}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Best rated this year */}
      {bestRated.length > 0 && (
        <section className="animate-in delay-4">
          <h2 className="font-serif text-lg font-semibold text-primary mb-5">
            Favourites in {year}
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {bestRated.map((ub) => ub.book && (
              <Link
                key={ub.id}
                href={`/books/${ub.book.id}`}
                className="group flex flex-col gap-1.5"
              >
                <div
                  className="shadow-md shadow-black/15 rounded-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200"
                >
                  <BookCover
                    coverUrl={ub.book.cover_url}
                    title={ub.book.title}
                    author={ub.book.authors?.[0]}
                    isbn={ub.book.isbn_13}
                    width={80}
                    height={120}
                    className="w-full"
                  />
                </div>
                <StarRating value={ub.rating} readonly size="sm" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Fun facts row */}
      {(topAuthors.length > 0 || longest) && (
        <section className="animate-in delay-5">
          <h2 className="font-serif text-lg font-semibold text-primary mb-5">Highlights</h2>
          <div className="grid sm:grid-cols-2 gap-3">

            {/* Top authors */}
            {topAuthors.length > 0 && (
              <div className="bg-surface border border-subtle rounded-2xl p-5 shadow-sm shadow-black/5">
                <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
                  Most read authors
                </p>
                <div className="space-y-2.5">
                  {topAuthors.map(([author, count]) => (
                    <div key={author} className="flex items-center justify-between gap-2">
                      <span className="text-sm text-primary truncate">{author}</span>
                      <span className="text-xs text-muted shrink-0 tabular-nums">
                        {count} book{count !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Longest book */}
            {longest?.book && (
              <Link
                href={`/books/${longest.book.id}`}
                className="bg-surface border border-subtle rounded-2xl p-5 shadow-sm shadow-black/5 hover:border-default transition-all group"
              >
                <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-4">
                  Longest book read
                </p>
                <div className="flex items-center gap-3">
                  <div className="shadow-md shadow-black/15 rounded-sm shrink-0">
                    <BookCover
                      coverUrl={longest.book.cover_url}
                      title={longest.book.title}
                      author={longest.book.authors?.[0]}
                      isbn={longest.book.isbn_13}
                      width={44}
                      height={66}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-primary line-clamp-2 leading-snug group-hover:text-link transition-colors">
                      {longest.book.title}
                    </p>
                    <p className="text-xs text-muted mt-1 tabular-nums">
                      {longest.book.page_count?.toLocaleString()} pages
                    </p>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>
      )}

    </div>
  );
}
