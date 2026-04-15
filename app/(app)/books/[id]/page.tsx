import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatAuthors, olWorkToBook } from '@/lib/utils';
import { BookCover } from '@/components/books/BookCover';
import { BookActions } from '@/components/books/BookActions';
import { SimilarBooks } from '@/components/books/SimilarBooks';
import type { UserBook, Book, OLWork } from '@/types';

interface Props { params: Promise<{ id: string }> }

export default async function BookDetailPage({ params }: Props) {
  const { id } = await params;

  let workRes: Response;
  try {
    workRes = await fetch(`https://openlibrary.org/works/${id}.json`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    notFound();
  }
  if (!workRes!.ok) notFound();

  const work: OLWork = await workRes.json();

  const authorKeys = (work.authors ?? []).slice(0, 3).map((a) => a.author.key);
  const authorNames = await Promise.all(
    authorKeys.map(async (key) => {
      try {
        const r = await fetch(`https://openlibrary.org${key}.json`, { next: { revalidate: 86400 } });
        const data = await r.json();
        return typeof data.name === 'string' ? data.name : null;
      } catch {
        return null;
      }
    })
  ).then((names) => names.filter((n): n is string => n !== null));

  const book: Book = olWorkToBook(work, authorNames);

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
    <div className="max-w-2xl mx-auto">

      {/* ── Book header ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 mb-10 animate-in">
        {/* Cover — centered on mobile, left-aligned on sm+ */}
        <div className="flex sm:block justify-center flex-shrink-0" style={{ filter: 'drop-shadow(0 20px 32px rgba(0,0,0,0.22))' }}>
          <BookCover coverUrl={book.cover_url} title={book.title} author={book.authors?.[0]} isbn={book.isbn_13} width={130} height={195} />
        </div>

        <div className="flex-1 min-w-0 flex flex-col sm:justify-end pb-1">
          {book.categories?.[0] && (
            <p className="text-xs font-semibold text-link tracking-widest uppercase mb-3">
              {book.categories[0]}
            </p>
          )}

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary leading-tight mb-2">
            {book.title}
          </h1>

          <p className="text-base text-secondary italic mb-5">
            {formatAuthors(book.authors)}
          </p>

          <div className="flex items-center gap-3 text-xs text-muted mb-6 flex-wrap">
            {publishYear && <span>{publishYear}</span>}
            {publishYear && book.page_count && <span className="opacity-30">·</span>}
            {book.page_count && <span>{book.page_count} pages</span>}
            {book.isbn_13 && (
              <>
                <span className="opacity-30">·</span>
                <span className="font-mono opacity-70">{book.isbn_13}</span>
              </>
            )}
          </div>

          {/* Client component owns userBook state so ReviewForm/ProgressTracker
              appear immediately after first shelf add without a page reload */}
          <BookActions book={book} initialUserBook={userBook} />
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────── */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        <span className="font-serif text-muted opacity-40 text-base">✦</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* ── Description ──────────────────────────────── */}
      {description && (
        <section className="animate-in delay-1">
          <h2 className="font-serif text-sm font-semibold text-muted uppercase tracking-widest mb-4">
            About this book
          </h2>
          <p className="text-secondary leading-8 text-[15px]">{description}</p>
        </section>
      )}

      {/* ── Similar books (vector search) ────────────── */}
      <SimilarBooks
        bookId={book.id}
        title={book.title}
        authors={book.authors}
        categories={book.categories}
        description={book.description}
      />

      {/* ── Find similar (vibe search fallback) ──────── */}
      <div className="mt-10">
        <Link
          href={`/search?mode=vibe&vibe=${encodeURIComponent(`Books similar to "${book.title}" by ${formatAuthors(book.authors)}`)}`}
          className="flex items-center gap-2 text-sm text-muted hover:text-link transition-colors group"
        >
          <span className="text-xs opacity-60 group-hover:opacity-100 transition-opacity">✦</span>
          Find books like this one
          <span className="opacity-40 group-hover:opacity-100 transition-opacity">→</span>
        </Link>
      </div>

    </div>
  );
}
