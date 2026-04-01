'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Book, ShelfType, UserBook } from '@/types';
import { SHELF_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface ShelfSelectorProps {
  book: Book;
  userBook: UserBook | null;
  onUpdate?: (userBook: UserBook | null) => void;
}

const SHELVES: ShelfType[] = ['want_to_read', 'reading', 'read'];

const shelfIcons: Record<ShelfType, string> = {
  want_to_read: '○',
  reading: '→',
  read: '✓',
};

export function ShelfSelector({ book, userBook, onUpdate }: ShelfSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState<UserBook | null>(userBook);

  async function selectShelf(shelf: ShelfType) {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    await supabase.from('books').upsert({
      id: book.id, title: book.title, authors: book.authors,
      description: book.description, cover_url: book.cover_url,
      isbn_13: book.isbn_13, page_count: book.page_count,
      published_date: book.published_date, categories: book.categories,
    });

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_books')
      .upsert({
        user_id: user.id, book_id: book.id, shelf,
        started_at:  shelf === 'want_to_read' ? null
                   : shelf === 'reading' && !current?.started_at ? now
                   : (current?.started_at ?? null),
        finished_at: shelf === 'read' && !current?.finished_at ? now
                   : shelf !== 'read' ? null
                   : (current?.finished_at ?? null),
      }, { onConflict: 'user_id,book_id' })
      .select().single();

    if (!error && data) { setCurrent(data as UserBook); onUpdate?.(data as UserBook); }
    setLoading(false);
  }

  async function removeFromShelf() {
    if (!current) return;
    setLoading(true);
    const supabase = createClient();
    await supabase.from('user_books').delete().eq('id', current.id);
    setCurrent(null);
    onUpdate?.(null);
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {SHELVES.map((shelf) => {
          const isActive = current?.shelf === shelf;
          return (
            <button
              key={shelf}
              onClick={() => selectShelf(shelf)}
              disabled={loading}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 disabled:opacity-50 border',
                isActive
                  ? 'bg-btn text-btn-fg border-transparent shadow-md shadow-black/10'
                  : 'bg-surface text-secondary border-subtle hover:border-default hover:bg-surface-hover hover:text-primary'
              )}
            >
              <span className={cn('text-xs', isActive ? 'opacity-80' : 'text-muted')}>
                {shelfIcons[shelf]}
              </span>
              {SHELF_LABELS[shelf]}
            </button>
          );
        })}
      </div>

      {current && (
        <button
          onClick={removeFromShelf}
          disabled={loading}
          className="text-xs text-muted hover:text-red-400 transition-colors disabled:opacity-50"
        >
          Remove from shelf
        </button>
      )}
    </div>
  );
}
