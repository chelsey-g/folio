import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { googleVolumeToBook, formatAuthors } from '@/lib/utils';
import { BookCover } from '@/components/books/BookCover';
import { ShelfSelector } from '@/components/books/ShelfSelector';
import { ReviewForm } from '@/components/books/ReviewForm';
import { ProgressTracker } from '@/components/books/ProgressTracker';
import { StarRating } from '@/components/ui/StarRating';
import type { UserBook } from '@/types';

interface Props { params: Promise<{ id: string }> }

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;

  const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) notFound();

  const volume = await res.json();
  const book   = googleVolumeToBook(volume);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let userBook: UserBook | null = null;
  if (user) {
    const { data } = await supabase
      .from('user_books').select('*')
      .eq('user_id', user.id).eq('book_id', id).maybeSingle();
    userBook = data as UserBook | null;
  }

  const description = book.description?.replace(/<[^>]+>/g, '') ?? null;
  const publishYear = book.published_date?.slice(0, 4);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Book header */}
      <div className="bg-surface border border-subtle rounded-3xl p-6 shadow-sm shadow-black/5">
        <div className="flex gap-6">
          <div className="flex-shrink-0 shadow-xl shadow-black/20 rounded-sm">
            <BookCover coverUrl={book.cover_url} title={book.title} width={110} height={165} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl font-bold text-primary leading-tight mb-1">
              {book.title}
            </h1>
            <p className="text-secondary text-sm mb-4">{formatAuthors(book.authors)}</p>

            <div className="flex flex-wrap gap-2 mb-5">
              {book.page_count && (
                <span className="text-xs px-2.5 py-1 bg-surface-hover text-secondary rounded-full border border-subtle">
                  {book.page_count} pages
                </span>
              )}
              {publishYear && (
                <span className="text-xs px-2.5 py-1 bg-surface-hover text-secondary rounded-full border border-subtle">
                  {publishYear}
                </span>
              )}
              {book.categories?.[0] && (
                <span className="text-xs px-2.5 py-1 bg-accent-soft text-link rounded-full border border-accent-soft">
                  {book.categories[0]}
                </span>
              )}
              {book.isbn_13 && (
                <span className="text-xs px-2.5 py-1 bg-surface-hover text-muted rounded-full border border-subtle font-mono">
                  {book.isbn_13}
                </span>
              )}
            </div>

            <ShelfSelector book={book} userBook={userBook} />
          </div>
        </div>
      </div>

      {/* Progress tracker */}
      {userBook?.shelf === 'reading' && (
        <ProgressTracker userBook={userBook} pageCount={book.page_count} />
      )}

      {/* Description */}
      {description && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-3">About this book</h2>
          <p className="text-secondary text-sm leading-7">{description}</p>
        </section>
      )}

      {/* Review */}
      {userBook && (
        <section>
          <h2 className="font-serif text-lg font-semibold text-primary mb-4 flex items-center gap-2">
            {userBook.rating ? (
              <>Your review <StarRating value={userBook.rating} readonly size="sm" /></>
            ) : (
              'Leave a review'
            )}
          </h2>
          <ReviewForm userBook={userBook} />
        </section>
      )}
    </div>
  );
}
