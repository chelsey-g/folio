import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookCard } from '@/components/books/BookCard';
import { ProfileStats } from '@/components/profile/ProfileStats';
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
  const booksRead      = books.filter((b) => b.shelf === 'read').length;
  const reading        = books.filter((b) => b.shelf === 'reading').length;
  const wantToRead     = books.filter((b) => b.shelf === 'want_to_read').length;
  const recentRead     = books.filter((b) => b.shelf === 'read').slice(0, 6);
  const currentReading = books.filter((b) => b.shelf === 'reading').slice(0, 3);
  const rated          = books.filter((b) => b.rating);
  const avgRating      = rated.length > 0
    ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
    : null;

  const isOwnProfile = user?.id === profile.id;
  const initial = (profile.full_name ?? profile.username)[0].toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-surface border border-subtle rounded-3xl p-6 shadow-sm shadow-black/5">
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
                  Edit profile
                </Link>
              )}
            </div>
            {profile.bio && (
              <p className="text-sm text-secondary mt-2 leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>
        <div className="mt-6">
          <ProfileStats
            booksRead={booksRead} booksReading={reading}
            wantToRead={wantToRead} avgRating={avgRating}
          />
        </div>
      </div>

      {currentReading.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Currently reading</h2>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {currentReading.map((ub) =>
              ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} /> : null
            )}
          </div>
        </section>
      )}

      {recentRead.length > 0 && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Recently read</h2>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {recentRead.map((ub) =>
              ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} /> : null
            )}
          </div>
        </section>
      )}

      {books.length === 0 && (
        <p className="text-center text-muted text-sm py-12">
          {isOwnProfile
            ? "You haven't added any books yet."
            : `@${profile.username} hasn't added any books yet.`}
        </p>
      )}
    </div>
  );
}
