'use client';

import { useState, useMemo } from 'react';
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
type SortKey  = 'updated' | 'title_asc' | 'title_desc' | 'rating' | 'date_read' | 'date_added';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'updated',    label: 'Recently updated' },
  { value: 'date_added', label: 'Date added' },
  { value: 'date_read',  label: 'Date read' },
  { value: 'title_asc',  label: 'Title A–Z' },
  { value: 'title_desc', label: 'Title Z–A' },
  { value: 'rating',     label: 'Rating' },
];

function sortBooks(books: UserBook[], sort: SortKey): UserBook[] {
  return [...books].sort((a, b) => {
    switch (sort) {
      case 'updated':
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      case 'date_added':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'date_read':
        if (!a.finished_at && !b.finished_at) return 0;
        if (!a.finished_at) return 1;
        if (!b.finished_at) return -1;
        return new Date(b.finished_at).getTime() - new Date(a.finished_at).getTime();
      case 'title_asc':
        return (a.book?.title ?? '').localeCompare(b.book?.title ?? '');
      case 'title_desc':
        return (b.book?.title ?? '').localeCompare(a.book?.title ?? '');
      case 'rating':
        return (b.rating ?? 0) - (a.rating ?? 0);
      default:
        return 0;
    }
  });
}

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
  const [viewMode,    setViewMode]    = useState<ViewMode>('list');
  const [sortKey,     setSortKey]     = useState<SortKey>('updated');
  const [search,      setSearch]      = useState('');

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

  const displayed = useMemo(() => {
    let result = activeShelf === 'all'
      ? userBooks
      : userBooks.filter((b) => b.shelf === activeShelf);

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((b) =>
        b.book?.title?.toLowerCase().includes(q) ||
        b.book?.authors?.some((a) => a.toLowerCase().includes(q))
      );
    }

    return sortBooks(result, sortKey);
  }, [userBooks, activeShelf, search, sortKey]);

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          width="14" height="14" viewBox="0 0 15 15" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <line x1="10" y1="10" x2="14" y2="14" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by title or author…"
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-subtle rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent placeholder:text-muted"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-surface-hover rounded-xl p-1 border border-subtle overflow-x-auto scrollbar-none">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveShelf(id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap shrink-0',
                activeShelf === id
                  ? 'bg-surface text-primary shadow-sm shadow-black/5 border border-subtle'
                  : 'text-muted hover:text-secondary'
              )}
            >
              {id !== 'all' && (
                <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', shelfDot[id as ShelfType])} />
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

        {/* Sort + view toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="text-xs text-secondary bg-surface border border-subtle rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--link)] cursor-pointer hover:border-default transition-colors"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

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
      </div>

      {/* Empty state */}
      {displayed.length === 0 && (
        <div className="text-center py-20">
          <p className="text-4xl mb-3 opacity-40">◎</p>
          <p className="text-muted text-sm">
            {search ? `No books matching "${search}"` : 'Nothing here yet'}
          </p>
          {search && (
            <button
              onClick={() => setSearch('')}
              className="mt-3 text-xs text-link hover:opacity-80 transition-opacity"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* List view */}
      {viewMode === 'list' && displayed.length > 0 && (
        <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
          {displayed.map((ub) =>
            ub.book ? <BookCard key={ub.id} book={ub.book} userBook={ub} /> : null
          )}
        </div>
      )}

      {/* Grid view */}
      {viewMode === 'grid' && displayed.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-x-4 gap-y-7">
          {displayed.map((ub) => {
            if (!ub.book) return null;
            return (
              <Link key={ub.id} href={`/books/${ub.book.id}`} className="group flex flex-col gap-2">
                <div className="relative shadow-md shadow-black/20 rounded-sm group-hover:shadow-xl group-hover:-translate-y-2 transition-all duration-200">
                  <BookCover
                    coverUrl={ub.book.cover_url}
                    title={ub.book.title}
                    author={ub.book.authors?.[0]}
                    isbn={ub.book.isbn_13}
                    width={96}
                    height={144}
                    className="w-full"
                  />
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

      {/* Result count when filtering */}
      {search && displayed.length > 0 && (
        <p className="text-xs text-muted text-center mt-6 tabular-nums">
          {displayed.length} book{displayed.length !== 1 ? 's' : ''} matching &ldquo;{search}&rdquo;
        </p>
      )}
    </div>
  );
}
