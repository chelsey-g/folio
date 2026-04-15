import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookCover } from '@/components/books/BookCover';
import { BookCard } from '@/components/books/BookCard';
import { CurrentlyReadingCard } from '@/components/books/CurrentlyReadingCard';
import { ProfileStats } from '@/components/profile/ProfileStats';
import { ReadingGoal } from '@/components/profile/ReadingGoal';
import { AgentNotification } from '@/components/home/AgentNotification';
import type { UserBook, Book } from '@/types';

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

  const [{ data: profile }, { data: userBooks }, { data: rawNotif }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('user_books').select('*, book:books(*)')
      .eq('user_id', user.id).order('updated_at', { ascending: false }).limit(100),
    supabase.from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('dismissed', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  // Fetch the recommended book for the notification (if any)
  let notifBook: Book | null = null;
  let finishedBookTitle = '';
  if (rawNotif) {
    const [{ data: recBook }, { data: finBook }] = await Promise.all([
      rawNotif.recommended_book_id
        ? supabase.from('books').select('*').eq('id', rawNotif.recommended_book_id).single()
        : Promise.resolve({ data: null }),
      rawNotif.finished_book_id
        ? supabase.from('books').select('title').eq('id', rawNotif.finished_book_id).single()
        : Promise.resolve({ data: null }),
    ]);
    notifBook = recBook as Book | null;
    finishedBookTitle = (finBook as { title: string } | null)?.title ?? '';
  }

  const books      = (userBooks ?? []) as UserBook[];
  const reading    = books.filter((b) => b.shelf === 'reading');
  const readBooks  = books.filter((b) => b.shelf === 'read');
  const wantToRead = books.filter((b) => b.shelf === 'want_to_read');
  const recent     = books.filter((b) => b.shelf !== 'reading').slice(0, 6);

  const rated     = books.filter((b) => b.rating);
  const avgRating = rated.length > 0
    ? rated.reduce((s, b) => s + (b.rating ?? 0), 0) / rated.length
    : null;

  const year = new Date().getFullYear();
  const readThisYear = readBooks.filter((b) =>
    b.finished_at && new Date(b.finished_at).getFullYear() === year
  ).length;

  const totalPages = readBooks.reduce((s, b) => s + (b.book?.page_count ?? 0), 0);

  // Up next — first 5 from want_to_read shelf (ordered by updated_at already)
  const upNext = wantToRead.slice(0, 5).filter((b) => b.book);

  const name = profile?.full_name?.split(' ')[0] ?? profile?.username ?? 'there';

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* ── Agent notification ─────────────────────── */}
      {rawNotif && (
        <AgentNotification
          notification={rawNotif}
          recommendedBook={notifBook}
          finishedBookTitle={finishedBookTitle}
        />
      )}

      {/* ── Header ─────────────────────────────────── */}
      <section className="animate-in">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">
          {getGreeting()}
        </p>
        <h1 className="font-serif text-4xl font-bold text-primary mb-6">{name}</h1>

        <div className="bg-surface border border-subtle rounded-2xl px-6 py-5 shadow-sm shadow-black/5">
          <ProfileStats
            booksRead={readBooks.length}
            booksReading={reading.length}
            wantToRead={wantToRead.length}
            avgRating={avgRating}
          />
          {totalPages > 0 && (
            <p className="text-xs text-muted text-center mt-4 tabular-nums">
              {totalPages.toLocaleString()} pages read all time
            </p>
          )}
        </div>
      </section>

      {/* ── Reading Goal ───────────────────────────── */}
      <div className="animate-in delay-1">
        <ReadingGoal
          goal={profile?.reading_goal ?? null}
          readThisYear={readThisYear}
          year={year}
        />
      </div>

      {/* ── Currently Reading ──────────────────────── */}
      {reading.length > 0 && (
        <section className="animate-in delay-2">
          <h2 className="font-serif text-lg font-semibold text-primary mb-4">Currently reading</h2>
          <div className="space-y-3">
            {reading.map((ub) =>
              ub.book ? <CurrentlyReadingCard key={ub.id} userBook={ub} /> : null
            )}
          </div>
        </section>
      )}

      {/* ── Up Next ────────────────────────────────── */}
      {upNext.length > 0 && (
        <section className="animate-in delay-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-primary">Up next</h2>
            <Link href="/shelf" className="text-xs font-medium text-muted hover:text-link transition-colors">
              View shelf →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
            {upNext.map((ub) => ub.book && (
              <Link
                key={ub.id}
                href={`/books/${ub.book.id}`}
                className="flex-shrink-0 w-[72px] group"
              >
                <div className="shadow-md shadow-black/15 rounded-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200">
                  <BookCover
                    coverUrl={ub.book.cover_url}
                    title={ub.book.title}
                    author={ub.book.authors?.[0]}
                    isbn={ub.book.isbn_13}
                    width={72}
                    height={108}
                    className="w-full"
                  />
                </div>
                <p className="text-[11px] text-primary font-medium line-clamp-2 leading-snug mt-2 group-hover:text-link transition-colors">
                  {ub.book.title}
                </p>
                <p className="text-[10px] text-muted line-clamp-1 mt-0.5">
                  {ub.book.authors?.[0] ?? ''}
                </p>
              </Link>
            ))}
            {/* Discover prompt */}
            <Link
              href="/search"
              className="flex-shrink-0 w-[72px] group flex flex-col items-center justify-center gap-1.5"
            >
              <div
                className="w-[72px] h-[108px] rounded-sm border-2 border-dashed border-subtle group-hover:border-default flex items-center justify-center transition-colors"
              >
                <span className="text-xl text-muted group-hover:text-primary transition-colors">+</span>
              </div>
              <p className="text-[10px] text-muted group-hover:text-link transition-colors text-center leading-snug">
                Discover more
              </p>
            </Link>
          </div>
        </section>
      )}

      {/* ── Recent Activity ─────────────────────────── */}
      {recent.length > 0 && (
        <section className="animate-in delay-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-lg font-semibold text-primary">Recent activity</h2>
            <Link href="/shelf" className="text-xs font-medium text-muted hover:text-link transition-colors">
              View shelf →
            </Link>
          </div>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {recent.map((ub) =>
              ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} compact /> : null
            )}
          </div>
        </section>
      )}

      {/* ── Empty state ──────────────────────────────── */}
      {books.length === 0 && (
        <div className="text-center py-24 animate-in delay-2">
          <div className="w-14 h-14 bg-accent-soft rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5">
            📖
          </div>
          <h2 className="font-serif text-xl font-semibold text-primary mb-2">
            Your reading journey starts here
          </h2>
          <p className="text-sm text-muted mb-7 max-w-xs mx-auto">
            Search for a book you love and add it to your shelf.
          </p>
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
