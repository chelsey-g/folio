'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookCard } from './BookCard';
import { BookCover } from './BookCover';
import { Badge } from '@/components/ui/Badge';
import { StarRating } from '@/components/ui/StarRating';
import { cn } from '@/lib/utils';
import type { UserBook, ShelfType } from '@/types';
import { SHELF_LABELS } from '@/types';

interface ShelfViewProps {
  userBooks: UserBook[];
}

const SHELF_ORDER: ShelfType[] = ['reading', 'want_to_read', 'read'];

const shelfBadgeVariant: Record<ShelfType, 'amber' | 'blue' | 'green'> = {
  want_to_read: 'amber',
  reading: 'blue',
  read: 'green',
};

type ViewMode = 'list' | 'grid';

export function ShelfView({ userBooks }: ShelfViewProps) {
  const [activeShelf, setActiveShelf] = useState<ShelfType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filtered =
    activeShelf === 'all' ? userBooks : userBooks.filter((b) => b.shelf === activeShelf);

  const counts = {
    all: userBooks.length,
    reading:      userBooks.filter((b) => b.shelf === 'reading').length,
    want_to_read: userBooks.filter((b) => b.shelf === 'want_to_read').length,
    read:         userBooks.filter((b) => b.shelf === 'read').length,
  };

  return (
    <div>
      {/* Tabs + view toggle */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {(['all', ...SHELF_ORDER] as const).map((shelf) => (
            <button
              key={shelf}
              onClick={() => setActiveShelf(shelf)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                activeShelf === shelf
                  ? 'bg-btn text-btn-fg shadow-sm'
                  : 'text-secondary hover:text-primary hover:bg-surface-hover'
              )}
            >
              {shelf === 'all' ? 'All books' : SHELF_LABELS[shelf]}
              <span
                className={cn(
                  'text-xs rounded-full px-1.5 py-0.5 font-medium leading-none',
                  activeShelf === shelf
                    ? 'bg-white/20 text-inherit'
                    : 'bg-surface-hover text-muted'
                )}
              >
                {counts[shelf]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-surface-hover rounded-lg p-1 border border-subtle">
          {(['list', 'grid'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={`${mode} view`}
              className={cn(
                'px-2.5 py-1.5 rounded-md text-sm transition-all',
                viewMode === mode
                  ? 'bg-surface shadow-sm text-primary'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {mode === 'list' ? '☰' : '⊞'}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-muted text-sm">Nothing here yet</p>
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && filtered.length > 0 && (
        <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
          {filtered.map((ub) =>
            ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} /> : null
          )}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && filtered.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-6">
          {filtered.map((ub) => {
            if (!ub.book) return null;
            return (
              <Link key={ub.id} href={`/books/${ub.book.id}`} className="group flex flex-col gap-2">
                <div className="relative shadow-md shadow-black/20 rounded-sm group-hover:shadow-xl group-hover:-translate-y-1.5 transition-all duration-200">
                  <BookCover
                    coverUrl={ub.book.cover_url}
                    title={ub.book.title}
                    width={96}
                    height={144}
                    className="w-full"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <Badge variant={shelfBadgeVariant[ub.shelf]} className="px-1 py-0.5 text-[10px]">
                      {ub.shelf === 'reading' ? '→' : ub.shelf === 'read' ? '✓' : '○'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-primary font-medium line-clamp-2 leading-snug group-hover:text-link transition-colors">
                    {ub.book.title}
                  </p>
                  {ub.rating && (
                    <div className="mt-0.5">
                      <StarRating value={ub.rating} readonly size="sm" />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
