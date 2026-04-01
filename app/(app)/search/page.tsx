'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { BookCard } from '@/components/books/BookCard';
import { BookCover } from '@/components/books/BookCover';
import type { Book } from '@/types';

const CATEGORIES = [
  { label: 'Fiction',          query: 'fiction',     emoji: '📖' },
  { label: 'Fantasy & Sci-Fi', query: 'fantasy',     emoji: '🪄' },
  { label: 'Science',          query: 'science',     emoji: '🔬' },
  { label: 'History',          query: 'history',     emoji: '🏛️' },
  { label: 'Biography',        query: 'biography',   emoji: '✍️' },
];

const VIBE_PROMPTS = [
  'a quiet novel about grief and solitude in Scandinavia',
  'fast-paced thriller with an unreliable narrator',
  'epic fantasy with deep world-building and magic systems',
  'short stories about ordinary people in extraordinary moments',
  'science fiction that explores climate and ecological collapse',
  'a coming-of-age story set in the 1980s',
  'literary fiction about memory and identity',
  'dark humour and satire about modern capitalism',
];

interface CategoryRow {
  label: string;
  query: string;
  emoji: string;
  books: Book[];
}

interface VibeBook extends Book {
  score: number;
  matchedSubjects: string[];
}

type SearchMode = 'keyword' | 'vibe';

async function fetchCategory(query: string): Promise<Book[]> {
  const res = await fetch(`/api/books?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const data: { items: Book[] } = await res.json();
  return (data.items ?? []).slice(0, 10);
}

export default function SearchPage() {
  const [mode,        setMode]        = useState<SearchMode>('keyword');
  const [query,       setQuery]       = useState('');
  const [results,     setResults]     = useState<Book[]>([]);
  const [vibeResults, setVibeResults] = useState<VibeBook[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [activeQuery, setActiveQuery] = useState('');
  const [categories,  setCategories]  = useState<CategoryRow[]>([]);
  const [catsLoading, setCatsLoading] = useState(true);
  const requestIdRef = useState(() => ({ current: 0 }))[0];

  useEffect(() => {
    Promise.all(
      CATEGORIES.map(async (cat) => ({
        ...cat,
        books: await fetchCategory(cat.query),
      }))
    ).then((rows) => {
      setCategories(rows.filter((r) => r.books.length > 0));
      setCatsLoading(false);
    });
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const id = ++requestIdRef.current;
    setLoading(true);
    setSearched(true);
    setActiveQuery(q.trim());
    try {
      const res = await fetch(`/api/books?q=${encodeURIComponent(q.trim())}`);
      if (id !== requestIdRef.current) return;
      if (!res.ok) { setResults([]); return; }
      const data: { items: Book[] } = await res.json();
      setResults(data.items ?? []);
    } catch {
      if (id === requestIdRef.current) setResults([]);
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, [requestIdRef]);

  const vibeSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    const id = ++requestIdRef.current;
    setLoading(true);
    setSearched(true);
    setActiveQuery(q.trim());
    try {
      const res = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim() }),
      });
      if (id !== requestIdRef.current) return;
      if (!res.ok) { setVibeResults([]); return; }
      const data: { items: VibeBook[] } = await res.json();
      setVibeResults(data.items ?? []);
    } catch {
      if (id === requestIdRef.current) setVibeResults([]);
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, [requestIdRef]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'keyword') search(query);
    else vibeSearch(query);
  }

  function reset() {
    setSearched(false);
    setResults([]);
    setVibeResults([]);
    setQuery('');
  }

  function switchMode(m: SearchMode) {
    setMode(m);
    reset();
  }

  const hasResults = mode === 'keyword' ? results.length > 0 : vibeResults.length > 0;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-serif text-3xl font-bold text-primary mb-2">Discover</h1>
      <p className="text-sm text-muted mb-5">Search millions of books and add them to your shelf.</p>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 bg-surface border border-subtle rounded-xl mb-5 w-fit">
        <button
          onClick={() => switchMode('keyword')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'keyword'
              ? 'bg-btn text-btn-fg shadow-sm'
              : 'text-muted hover:text-primary'
          }`}
        >
          Search
        </button>
        <button
          onClick={() => switchMode('vibe')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
            mode === 'vibe'
              ? 'bg-btn text-btn-fg shadow-sm'
              : 'text-muted hover:text-primary'
          }`}
        >
          <span>✦</span>
          Vibe Search
        </button>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          {mode === 'keyword' ? (
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              width="15" height="15" viewBox="0 0 15 15" fill="none"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
            >
              <circle cx="6.5" cy="6.5" r="4.5" />
              <line x1="10" y1="10" x2="14" y2="14" />
            </svg>
          ) : (
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">✦</span>
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              mode === 'keyword'
                ? 'Title, author, or ISBN…'
                : 'Describe the vibe, mood, or feeling you\'re after…'
            }
            className="w-full pl-9 pr-4 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent shadow-sm placeholder:text-muted"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-btn text-btn-fg rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 shadow-sm"
        >
          {loading ? '…' : mode === 'keyword' ? 'Search' : 'Find'}
        </button>
      </form>

      {/* Vibe example prompts (pre-search) */}
      {mode === 'vibe' && !searched && (
        <div className="mb-8">
          <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-3">Try asking for…</p>
          <div className="flex flex-wrap gap-2">
            {VIBE_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setQuery(prompt); vibeSearch(prompt); }}
                className="text-xs px-3 py-1.5 bg-surface border border-subtle rounded-full text-secondary hover:border-default hover:text-primary transition-all"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ── */}
      {loading && (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-subtle border-t-[var(--link)] rounded-full animate-spin" />
          <p className="text-sm text-muted">
            {mode === 'vibe' ? 'Finding your vibe…' : 'Searching books…'}
          </p>
        </div>
      )}

      {/* ── No results ── */}
      {!loading && searched && !hasResults && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3 opacity-40">◎</p>
          <p className="text-secondary text-sm">No results for &ldquo;{activeQuery}&rdquo;</p>
        </div>
      )}

      {/* ── Keyword results ── */}
      {!loading && searched && mode === 'keyword' && results.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted">
              {results.length} results for &ldquo;{activeQuery}&rdquo;
            </p>
            <button
              onClick={reset}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              ← Browse categories
            </button>
          </div>
          <div className="bg-surface border border-subtle rounded-2xl overflow-hidden shadow-sm shadow-black/5 divide-y divide-[var(--border)]">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        </>
      )}

      {/* ── Vibe results ── */}
      {!loading && searched && mode === 'vibe' && vibeResults.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-muted">
                Best matches for &ldquo;{activeQuery}&rdquo;
              </p>
            </div>
            <button
              onClick={reset}
              className="text-xs text-muted hover:text-primary transition-colors"
            >
              ← Try another vibe
            </button>
          </div>
          <div className="space-y-3">
            {vibeResults.map((book, i) => (
              <Link
                key={book.id}
                href={`/books/${book.id}`}
                className="flex gap-4 p-4 bg-surface border border-subtle rounded-2xl hover:border-default transition-all group shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/8"
              >
                {/* Rank */}
                <div className="shrink-0 w-5 flex items-start pt-0.5">
                  <span className="text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                </div>

                {/* Cover */}
                <div className="shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
                  <BookCover coverUrl={book.cover_url} title={book.title} width={52} height={78} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <h3 className="font-serif font-semibold text-primary text-[15px] leading-snug group-hover:text-link transition-colors line-clamp-2">
                      {book.title}
                    </h3>
                    {/* Match badge */}
                    <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 bg-accent-soft rounded-full">
                      <span className="text-[10px] font-bold text-link tabular-nums">
                        {Math.round(book.score * 100)}%
                      </span>
                    </div>
                  </div>

                  {book.authors?.[0] && (
                    <p className="text-xs text-secondary italic mb-2">{book.authors[0]}</p>
                  )}

                  {/* Matched subjects */}
                  {book.matchedSubjects.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.matchedSubjects.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] px-2 py-0.5 bg-surface-hover border border-subtle rounded-full text-muted"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ── Category browse (pre-search, keyword mode) ── */}
      {!searched && mode === 'keyword' && (
        <div className="space-y-8">
          {catsLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 w-28 bg-surface-hover rounded-md animate-pulse" />
                  <div className="flex gap-3">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="flex-shrink-0 w-[72px] space-y-2">
                        <div className="w-[72px] h-[108px] bg-surface-hover rounded-sm animate-pulse" />
                        <div className="h-3 bg-surface-hover rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : categories.map((cat) => (
                <section key={cat.label}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-serif text-base font-semibold text-primary flex items-center gap-2">
                      <span className="text-sm">{cat.emoji}</span>
                      {cat.label}
                    </h2>
                    <button
                      onClick={() => { setQuery(cat.label); search(cat.label); }}
                      className="text-xs font-medium text-muted hover:text-link transition-colors"
                    >
                      See all →
                    </button>
                  </div>

                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
                    {cat.books.map((book) => (
                      <Link
                        key={book.id}
                        href={`/books/${book.id}`}
                        className="flex-shrink-0 w-[72px] group"
                      >
                        <div className="shadow-md shadow-black/15 rounded-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200">
                          <BookCover
                            coverUrl={book.cover_url}
                            title={book.title}
                            width={72}
                            height={108}
                            className="w-full"
                          />
                        </div>
                        <p className="text-[11px] text-primary font-medium line-clamp-2 leading-snug mt-2 group-hover:text-link transition-colors">
                          {book.title}
                        </p>
                        <p className="text-[10px] text-muted line-clamp-1 mt-0.5">
                          {book.authors?.[0] ?? ''}
                        </p>
                      </Link>
                    ))}
                  </div>
                </section>
              ))
          }
        </div>
      )}
    </div>
  );
}
