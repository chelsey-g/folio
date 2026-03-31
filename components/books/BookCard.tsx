import Link from 'next/link';
import { BookCover } from './BookCover';
import { StarRating } from '@/components/ui/StarRating';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatAuthors, truncate } from '@/lib/utils';
import type { Book, UserBook, ShelfType } from '@/types';
import { SHELF_LABELS } from '@/types';

interface BookCardProps {
  book: Book;
  userBook?: UserBook | null;
  compact?: boolean;
}

const shelfBadgeVariant: Record<ShelfType, 'amber' | 'blue' | 'green'> = {
  want_to_read: 'amber',
  reading: 'blue',
  read: 'green',
};

const CATEGORY_COLORS = [
  'bg-blue-50 text-blue-700 border border-blue-200',
  'bg-purple-50 text-purple-700 border border-purple-200',
  'bg-amber-50 text-amber-700 border border-amber-200',
  'bg-green-50 text-green-700 border border-green-200',
  'bg-rose-50 text-rose-700 border border-rose-200',
  'bg-teal-50 text-teal-700 border border-teal-200',
  'bg-orange-50 text-orange-700 border border-orange-200',
  'bg-indigo-50 text-indigo-700 border border-indigo-200',
];

function getCategoryColor(category: string): string {
  const hash = Array.from(category).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return CATEGORY_COLORS[hash % CATEGORY_COLORS.length];
}

export function BookCard({ book, userBook, compact = false }: BookCardProps) {
  const progress =
    userBook?.shelf === 'reading' &&
    (userBook.current_page ?? 0) > 0 &&
    book.page_count
      ? Math.min(100, Math.round(((userBook.current_page ?? 0) / book.page_count) * 100))
      : null;

  return (
    <Link
      href={`/books/${book.id}`}
      className="flex gap-4 px-4 py-3.5 bg-surface hover:bg-surface-hover transition-colors duration-150 group"
    >
      <div className="flex-shrink-0 shadow-md shadow-black/10 rounded-sm group-hover:shadow-lg transition-shadow duration-200">
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          width={compact ? 40 : 56}
          height={compact ? 60 : 84}
        />
      </div>

      <div className="flex-1 min-w-0 py-0.5">
        <p className="font-semibold text-primary text-sm leading-snug line-clamp-2 group-hover:text-link transition-colors duration-150">
          {book.title}
        </p>
        <p className="text-xs text-muted mt-0.5">{formatAuthors(book.authors)}</p>

        {!compact && book.description && (
          <p className="text-xs text-muted mt-1.5 line-clamp-2 leading-relaxed">
            {truncate(book.description.replace(/<[^>]+>/g, ''), 130)}
          </p>
        )}

        {progress !== null && (
          <div className="mt-2 space-y-1">
            <ProgressBar value={progress} />
            <span className="text-xs text-muted">
              {progress}% · {userBook?.current_page} of {book.page_count} pages
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {userBook && (
            <Badge variant={shelfBadgeVariant[userBook.shelf]}>
              {SHELF_LABELS[userBook.shelf]}
            </Badge>
          )}
          {userBook?.rating ? <StarRating value={userBook.rating} readonly size="sm" /> : null}
          {!compact && book.categories?.[0] && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(book.categories[0])}`}>
              {book.categories[0]}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
