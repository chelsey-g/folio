'use client';

import { useState, useCallback } from 'react';
import { BookCard } from '@/components/books/BookCard';
import { googleVolumeToBook } from '@/lib/utils';
import type { GoogleBooksResponse, Book } from '@/types';

const QUICK_SEARCHES = ['Fiction', 'Science', 'History', 'Philosophy', 'Fantasy', 'Biography'];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeQuery, setActiveQuery] = useState('');

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setSearched(true);
    setActiveQuery(q.trim());
    const res = await fetch(`/api/books?q=${encodeURIComponent(q.trim())}`);
    const data: GoogleBooksResponse = await res.json();
    setResults((data.items ?? []).map(googleVolumeToBook));
    setLoading(false);
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">Discover</h1>
      <p className="text-sm text-muted mb-6">Search millions of books and add them to your shelf.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); search(query); }}
        className="flex gap-2 mb-6"
      >
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, author, or ISBN…"
            className="w-full pl-9 pr-4 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent shadow-sm placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-btn text-btn-fg rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm"
        >
          Search
        </button>
      </form>

      {/* Quick chips */}
      {!searched && (
        <div className="flex flex-wrap gap-2 mb-10">
          {QUICK_SEARCHES.map((tag) => (
            <button
              key={tag}
              onClick={() => { setQuery(tag); search(tag); }}
              className="px-3 py-1.5 bg-surface border border-subtle rounded-full text-xs font-medium text-secondary hover:border-default hover:text-link hover:bg-accent-soft transition-all"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-subtle border-t-[var(--link)] rounded-full animate-spin" />
          <p className="text-sm text-muted">Searching books…</p>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3">📭</p>
          <p className="text-secondary text-sm">No results for &quot;{activeQuery}&quot;</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-muted mb-3">
            {results.length} results for &quot;{activeQuery}&quot;
          </p>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📚</p>
          <p className="text-muted text-sm">Over 40 million books waiting to be found</p>
        </div>
      )}
    </div>
  );
}
