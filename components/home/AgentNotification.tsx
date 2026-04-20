'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookCover } from '@/components/books/BookCover';
import type { Book } from '@/types';

interface Notification {
  id: string;
  type: string;
  message: string;
  book_title: string | null;
  finished_book_id: string | null;
  recommended_book_id: string | null;
}

interface Props {
  notification: Notification;
  recommendedBook: Book | null;
  finishedBookTitle: string;
}

export function AgentNotification({ notification, recommendedBook, finishedBookTitle }: Props) {
  const [dismissed, setDismissed] = useState(false);

  async function dismiss() {
    setDismissed(true);
    await fetch(`/api/notifications/${notification.id}/dismiss`, { method: 'POST' });
  }

  if (dismissed) return null;

  // Reading pace notification
  if (notification.type === 'reading_pace') {
    return (
      <div className="animate-in bg-surface border border-[var(--link)]/20 rounded-2xl p-4 shadow-sm shadow-black/5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-link flex items-center gap-1.5">
            <span>✦</span>
            Reading pace check-in
          </p>
          <button
            onClick={dismiss}
            className="text-muted hover:text-primary transition-colors text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
        <p className="text-sm text-secondary leading-relaxed">{notification.message}</p>
      </div>
    );
  }

  // Reading complete / book recommendation notification
  return (
    <div className="animate-in bg-surface border border-[var(--link)]/20 rounded-2xl p-4 shadow-sm shadow-black/5 relative">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-link flex items-center gap-1.5">
          <span>✦</span>
          You finished &ldquo;{finishedBookTitle}&rdquo;
        </p>
        <button
          onClick={dismiss}
          className="text-muted hover:text-primary transition-colors text-lg leading-none"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>

      <div className="flex gap-3 items-start">
        {recommendedBook && (
          <div className="shrink-0 shadow-md shadow-black/15 rounded-sm">
            <BookCover
              coverUrl={recommendedBook.cover_url}
              title={recommendedBook.title}
              author={recommendedBook.authors?.[0]}
              isbn={recommendedBook.isbn_13}
              width={48}
              height={72}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-secondary leading-relaxed mb-3">
            {notification.message}
          </p>
          {recommendedBook && (
            <Link
              href={`/books/${recommendedBook.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-link hover:opacity-80 transition-opacity"
            >
              Read next: {notification.book_title ?? recommendedBook.title}
              <span>→</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
