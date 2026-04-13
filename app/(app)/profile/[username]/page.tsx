import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookCard } from '@/components/books/BookCard';
import { BookCover } from '@/components/books/BookCover';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { StarRating } from '@/components/ui/StarRating';
import type { UserBook } from '@/types';

interface Props { params: Promise<{ username: string }> }

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  const [
    { data: { user } },
    { data: profile },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('profiles').select('*').eq('username', username).maybeSingle(),
  ]);

  if (!profile) notFound();

  const { data: userBooks } = await supabase
    .from('user_books').select('*, book:books(*)')
    .eq('user_id', profile.id).order('updated_at', { ascending: false });

  const books          = (userBooks ?? []) as UserBook[];
  const readBooks      = books.filter((b) => b.shelf === 'read');
  const booksRead      = readBooks.length;
  const reading        = books.filter((b) => b.shelf === 'reading').length;
  const wantToRead     = books.filter((b) => b.shelf === 'want_to_read').length;
  const currentReading = books.filter((b) => b.shelf === 'reading').slice(0, 3);
  const recentRead     = readBooks.slice(0, 6);

  const rated     = books.filter((b) => b.rating);
  const avgRating = rated.length > 0
    ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
    : null;

  // Top genres from read books
  const genreMap: Record<string, number> = {};
  readBooks.forEach((ub) => {
    const g = ub.book?.categories?.[0];
    if (g) genreMap[g] = (genreMap[g] ?? 0) + 1;
  });
  const topGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([g]) => g);

  // Favourites — 5-star books
  const favourites = books
    .filter((b) => b.rating === 5 && b.book)
    .slice(0, 10);

  const isOwnProfile = user?.id === profile.id;
  const initial = (profile.full_name ?? profile.username)[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-8">

      {/* ── Header card ──────────────────────────────── */}
      <div className="bg-surface border border-subtle rounded-3xl p-6 shadow-sm shadow-black/5 animate-in">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center text-2xl font-serif font-bold text-white shadow-md shadow-black/20 shrink-0">
            {initial}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="font-serif text-xl font-bold text-primary">
                  {profile.full_name ?? profile.username}
                </h1>
                <p className="text-sm text-muted">@{profile.username}</p>
              </div>
              {isOwnProfile && (
                <Link
                  href="/profile/edit"
                  className="text-xs font-medium text-muted hover:text-primary border border-subtle hover:border-default px-3 py-1.5 rounded-lg transition-all shrink-0"
                >
                  Edit
                </Link>
              )}
            </div>

            {profile.bio && (
              <p className="text-sm text-secondary mt-2 leading-relaxed">{profile.bio}</p>
            )}

            {/* Top genres */}
            {topGenres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {topGenres.map((g) => (
                  <span
                    key={g}
                    className="text-xs px-2.5 py-1 bg-accent-soft text-link border border-accent-soft rounded-full font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-6">
          <ProfileStats
            booksRead={booksRead} booksReading={reading}
            wantToRead={wantToRead} avgRating={avgRating}
          />
        </div>

        {/* Own-profile stats link */}
        {isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-subtle flex items-center justify-between">
            <p className="text-xs text-muted">
              {new Date().getFullYear()} reading goal & full analytics
            </p>
            <Link
              href="/stats"
              className="text-xs font-semibold text-link hover:opacity-75 transition-opacity"
            >
              View your stats →
            </Link>
          </div>
        )}
      </div>

      {/* ── Currently reading ────────────────────────── */}
      {currentReading.length > 0 && (
        <section className="animate-in delay-1">
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Currently reading</h2>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {currentReading.map((ub) =>
              ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} /> : null
            )}
          </div>
        </section>
      )}

      {/* ── Favourites (5★) ──────────────────────────── */}
      {favourites.length > 0 && (
        <section className="animate-in delay-2">
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Favourites</h2>
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {favourites.map((ub) => ub.book && (
              <Link
                key={ub.id}
                href={`/books/${ub.book.id}`}
                className="group flex flex-col gap-1.5"
                title={ub.book.title}
              >
                <div className="shadow-md shadow-black/15 rounded-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200">
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
                <StarRating value={5} readonly size="sm" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Recently read ─────────────────────────────── */}
      {recentRead.length > 0 && (
        <section className="animate-in delay-3">
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Recently read</h2>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {recentRead.map((ub) =>
              ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} /> : null
            )}
          </div>
        </section>
      )}

      {books.length === 0 && (
        <p className="text-center text-muted text-sm py-12 animate-in delay-1">
          {isOwnProfile
            ? "You haven't added any books yet."
            : `@${profile.username} hasn't added any books yet.`}
        </p>
      )}
    </div>
  );
}
