'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { BookCover } from './BookCover';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { formatAuthors } from '@/lib/utils';
import type { UserBook } from '@/types';

interface CurrentlyReadingCardProps {
  userBook: UserBook;
}

export function CurrentlyReadingCard({ userBook: initial }: CurrentlyReadingCardProps) {
  const [userBook,    setUserBook]    = useState(initial);
  const [inputPage,   setInputPage]   = useState(String(initial.current_page ?? 0));
  const [editing,     setEditing]     = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);

  const book      = userBook.book!;
  const pageCount = book.page_count;
  const curPage   = userBook.current_page ?? 0;
  const progress  = pageCount && pageCount > 0
    ? Math.min(100, Math.round((curPage / pageCount) * 100))
    : null;

  async function save(page: number) {
    if (saving) return;
    const clamped = Math.max(0, Math.min(pageCount ?? 999999, page));
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_books')
      .update({ current_page: clamped })
      .eq('id', userBook.id)
      .select('*, book:books(*)')
      .single();
    if (!error && data) {
      setUserBook(data as UserBook);
      setInputPage(String(clamped));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
    setEditing(false);
  }

  return (
    <div className="flex gap-5 p-5 bg-surface border border-subtle rounded-2xl shadow-sm shadow-black/5">
      {/* Cover — links to book detail */}
      <Link
        href={`/books/${book.id}`}
        className="flex-shrink-0 shadow-lg shadow-black/20 rounded-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        <BookCover
          coverUrl={book.cover_url}
          title={book.title}
          author={book.authors?.[0]}
          isbn={book.isbn_13}
          width={72}
          height={108}
        />
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
        {/* Title + author */}
        <Link href={`/books/${book.id}`} className="group">
          <p className="font-serif font-semibold text-primary text-base leading-snug line-clamp-2 group-hover:text-link transition-colors">
            {book.title}
          </p>
          <p className="text-xs text-muted mt-1">{formatAuthors(book.authors)}</p>
        </Link>

        {/* Progress */}
        <div className="space-y-2">
          {progress !== null && (
            <div className="flex items-center justify-between text-xs text-muted mb-1">
              <span className="tabular-nums">{curPage} of {pageCount} pages</span>
              <span className="font-semibold text-primary tabular-nums">{progress}%</span>
            </div>
          )}
          {progress !== null && <ProgressBar value={progress} />}

          {/* Inline update */}
          {editing ? (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="number"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save(parseInt(inputPage) || 0);
                  if (e.key === 'Escape') setEditing(false);
                }}
                min={0}
                max={pageCount ?? undefined}
                autoFocus
                className="w-20 px-2 py-1 bg-input border border-input rounded-lg text-xs text-primary text-center focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent"
              />
              <span className="text-xs text-muted">{pageCount ? `/ ${pageCount}` : 'pages'}</span>
              <button
                onClick={() => save(parseInt(inputPage) || 0)}
                disabled={saving}
                className="text-xs font-semibold bg-btn text-btn-fg px-3 py-1 rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {saving ? '…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setInputPage(String(curPage)); setEditing(true); }}
              className="text-xs text-muted hover:text-link transition-colors"
            >
              {saved ? '✓ Saved' : progress === null ? '+ Log progress' : 'Update progress'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
