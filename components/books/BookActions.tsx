'use client';

import { useState } from 'react';
import { ShelfSelector } from './ShelfSelector';
import { ProgressTracker } from './ProgressTracker';
import { ReviewForm } from './ReviewForm';
import { StarRating } from '@/components/ui/StarRating';
import type { Book, UserBook } from '@/types';

interface BookActionsProps {
  book: Book;
  initialUserBook: UserBook | null;
}

export function BookActions({ book, initialUserBook }: BookActionsProps) {
  const [userBook, setUserBook] = useState<UserBook | null>(initialUserBook);

  return (
    <>
      <ShelfSelector book={book} userBook={userBook} onUpdate={setUserBook} />

      <div className="space-y-8 mt-8">
        {userBook?.shelf === 'reading' && (
          <ProgressTracker
            userBook={userBook}
            pageCount={book.page_count}
            onUpdate={setUserBook}
          />
        )}

        {userBook && (
          <section>
            <h2 className="font-serif text-sm font-semibold text-muted uppercase tracking-widest mb-4 flex items-center gap-3">
              Your review
              {userBook.rating && <StarRating value={userBook.rating} readonly size="sm" />}
            </h2>
            <ReviewForm userBook={userBook} onUpdate={setUserBook} />
          </section>
        )}
      </div>
    </>
  );
}
