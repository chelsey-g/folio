'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookCard } from './BookCard';
import { BookCover } from './BookCover';
import { StarRating } from '@/components/ui/StarRating';
import { cn } from '@/lib/utils';
import type { UserBook, ShelfType } from '@/types';
import { SHELF_LABELS } from '@/types';

interface ShelfViewProps {
  userBooks: UserBook[];
}

const SHELF_ORDER: ShelfType[] = ['reading', 'want_to_read', 'read'];

const shelfDot: Record<ShelfType, string> = {
  reading:      'bg-[var(--link)]',
  want_to_read: 'bg-amber-400',
  read:         'bg-green-500',
};

type ViewMode = 'list' | 'grid';

const ListIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="1" y1="3" x2="13" y2="3" />
    <line x1="1" y1="7" x2="13" y2="7" />
    <line x1="1" y1="11" x2="13" y2="11" />
  </svg>
);

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="1" width="5" height="5" />
    <rect x="8" y="1" width="5" height="5" />
    <rect x="1" y="8" width="5" height="5" />
    <rect x="8" y="8" width="5" height="5" />
  </svg>
);

export function ShelfView({ userBooks }: ShelfViewProps) {
  const [activeShelf, setActiveShelf] = useState<ShelfType | 'all'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const filtered =
    activeShelf === 'all' ? userBooks : userBooks.filter((b) => b.shelf === activeShelf);

  const counts = {
    all:          userBooks.length,
    reading:      userBooks.filter((b) => b.shelf === 'reading').length,
    want_to_read: userBooks.filter((b) => b.shelf === 'want_to_read').length,
    read:         userBooks.filter((b) => b.shelf === 'read').length,
  };

  const tabs = [
    { id: 'all' as const,          label: 'All' },
    { id: 'reading' as const,      label: 'Reading' },
    { id: 'want_to_read' as const, label: 'Want to read' },
    { id: 'read' as const,         label: 'Read' },
  ];

  return (
    <div>
      {/* Controls row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-hover rounded-xl p-1 border border-subtle">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveShelf(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap',
                activeShelf === id
                  ? 'bg-surface text-primary shadow-sm shadow-black/5 border border-subtle'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {id !== 'all' && (
                <span className={cn('w-1.5 h-1.5 rounded-full', shelfDot[id as ShelfType])} />
              )}
              {label}
              <span className={cn(
                'text-[11px] font-semibold tabular-nums',
                activeShelf === id ? 'text-muted' : 'text-muted/60'
              )}>
                {counts[id]}
              </span>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-0.5 bg-surface-hover rounded-lg p-1 border border-subtle">
          {(['list', 'grid'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              title={`${mode} view`}
              className={cn(
                'w-7 h-7 flex items-center justify-center rounded-md transition-all duration-150',
                viewMode === mode
                  ? 'bg-surface shadow-sm text-primary'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {mode === 'list' ? <ListIcon /> : <GridIcon />}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3 opacity-40">◎</p>
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
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-7">
          {filtered.map((ub) => {
            if (!ub.book) return null;
            return (
              <Link key={ub.id} href={`/books/${ub.book.id}`} className="group flex flex-col gap-2">
                <div className="relative shadow-md shadow-black/20 rounded-sm group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-200">
                  <BookCover
                    coverUrl={ub.book.cover_url}
                    title={ub.book.title}
                    width={96}
                    height={144}
                    className="w-full"
                  />
                  {/* Status dot */}
                  <span className={cn(
                    'absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-[var(--surface)]',
                    shelfDot[ub.shelf]
                  )} />
                </div>
                <div>
                  <p className="text-xs text-primary font-medium line-clamp-2 leading-snug group-hover:text-link transition-colors">
                    {ub.book.title}
                  </p>
                  {ub.rating ? (
                    <div className="mt-0.5">
                      <StarRating value={ub.rating} readonly size="sm" />
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted mt-0.5 capitalize">
                      {SHELF_LABELS[ub.shelf]}
                    </p>
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
