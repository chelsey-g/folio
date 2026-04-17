import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { BookCover } from '@/components/books/BookCover';
import type { Book } from '@/types';

interface Notification {
  id: string;
  message: string;
  book_title: string | null;
  finished_book_id: string | null;
  recommended_book_id: string | null;
  created_at: string;
}

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rawNotifs } = await supabase
    .from('notifications')
    .select('id, message, book_title, finished_book_id, recommended_book_id, created_at')
    .eq('user_id', user.id)
    .eq('type', 'reading_complete')
    .order('created_at', { ascending: false });

  const notifs = (rawNotifs ?? []) as Notification[];

  // Fetch all book data in parallel
  const bookIds = [
    ...new Set([
      ...notifs.map((n) => n.recommended_book_id).filter(Boolean),
      ...notifs.map((n) => n.finished_book_id).filter(Boolean),
    ]),
  ] as string[];

  const { data: booksData } = bookIds.length > 0
    ? await supabase.from('books').select('*').in('id', bookIds)
    : { data: [] };

  const booksById = Object.fromEntries(
    ((booksData ?? []) as Book[]).map((b) => [b.id, b])
  );

  return (
    <div className="max-w-2xl mx-auto">

      <div className="mb-8 animate-in">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1.5">Claude</p>
        <h1 className="font-serif text-3xl font-bold text-primary">Recommendations</h1>
      </div>

      {notifs.length === 0 ? (
        <div className="text-center py-24 animate-in">
          <div className="w-14 h-14 bg-accent-soft rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5">
            ✦
          </div>
          <h2 className="font-serif text-xl font-semibold text-primary mb-2">No recommendations yet</h2>
          <p className="text-sm text-muted max-w-xs mx-auto">
            Finish a book and Claude will suggest what to read next based on your taste.
          </p>
        </div>
      ) : (
        <ul className="space-y-4 animate-in">
          {notifs.map((n) => {
            const rec      = n.recommended_book_id ? booksById[n.recommended_book_id] : null;
            const finished = n.finished_book_id    ? booksById[n.finished_book_id]    : null;
            const date     = new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            return (
              <li key={n.id} className="bg-surface border border-subtle rounded-2xl p-5 shadow-sm shadow-black/5">

                {/* Finished book context */}
                {finished && (
                  <p className="text-xs text-muted mb-3">
                    After finishing{' '}
                    <Link href={`/books/${finished.id}`} className="font-medium text-secondary hover:text-link transition-colors">
                      {finished.title}
                    </Link>
                    {' · '}{date}
                  </p>
                )}

                {/* Recommended book + message */}
                <div className="flex gap-4 items-start">
                  {rec && (
                    <Link href={`/books/${rec.id}`} className="shrink-0 shadow-md shadow-black/15 rounded-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
                      <BookCover
                        coverUrl={rec.cover_url}
                        title={rec.title}
                        author={rec.authors?.[0]}
                        isbn={rec.isbn_13}
                        width={60}
                        height={90}
                      />
                    </Link>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5 mb-2">
                      <span className="text-[var(--link)] text-xs mt-0.5 shrink-0">✦</span>
                      <p className="text-sm text-secondary leading-relaxed">{n.message}</p>
                    </div>
                    {rec && (
                      <Link
                        href={`/books/${rec.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:opacity-75 transition-opacity"
                      >
                        {n.book_title ?? rec.title}
                        <span>→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
