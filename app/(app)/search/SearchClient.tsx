'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookCard } from '@/components/books/BookCard';
import { BookCover } from '@/components/books/BookCover';
import type { Book, MoodFilters, SavedVibe } from '@/types';

interface CategoryRow {
  label: string;
  query: string;
  emoji: string;
  books: Book[];
}

interface VibeBook extends Book {
  reason: string;
  genres: string[];
}

type SearchMode = 'keyword' | 'vibe';

const VIBE_PROMPTS = [
  'a quiet novel about grief and solitude in Scandinavia',
  'fast-paced thriller with an unreliable narrator',
  'epic fantasy with deep world-building and magic systems',
  'short stories about ordinary people in extraordinary moments',
  'science fiction that explores climate and ecological collapse',
  'a coming-of-age story set in the 1980s',
  'literary fiction about memory and identity',
  'dark humour and satire about modern capitalism',
  'a slow-burn romance set in a small coastal town',
  'psychological horror with an atmosphere of dread',
  'historical fiction set during a little-known war',
  'a mystery where the detective is morally compromised',
  'magical realism rooted in Latin American culture',
  'a debut novel about immigrant identity and belonging',
  'non-fiction that reads like a thriller',
];

const EMPTY_MOODS: MoodFilters = { tone: null, pace: null, length: null };

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface SearchClientProps {
  initialCategories: CategoryRow[];
}

export function SearchClient({ initialCategories }: SearchClientProps) {
  const searchParams = useSearchParams();

  const [prompts,       setPrompts]       = useState<string[]>(VIBE_PROMPTS);
  const [mode,          setMode]          = useState<SearchMode>('keyword');
  const [query,         setQuery]         = useState('');
  const [results,       setResults]       = useState<Book[]>([]);
  const [vibeResults,   setVibeResults]   = useState<VibeBook[]>([]);
  const [loading,       setLoading]       = useState(false);
  const [searched,      setSearched]      = useState(false);
  const [activeQuery,   setActiveQuery]   = useState('');
  const [error,         setError]         = useState<string | null>(null);
  const [moods,         setMoods]         = useState<MoodFilters>(EMPTY_MOODS);
  const [savedVibes,    setSavedVibes]    = useState<SavedVibe[]>([]);
  const [isSaved,       setIsSaved]       = useState(false);
  const [savedId,       setSavedId]       = useState<string | null>(null);
  const [refinement,    setRefinement]    = useState('');
  const [showRefine,    setShowRefine]    = useState(false);
  const [copyMsg,       setCopyMsg]       = useState<string | null>(null);
  const [page,          setPage]          = useState(0); // used for load more
  const [excludedIds,   setExcludedIds]   = useState<string[]>([]);
  const requestIdRef = useRef(0);

  useEffect(() => { setPrompts(shuffled(VIBE_PROMPTS)); }, []);

  // Load saved vibes on mount
  useEffect(() => {
    fetch('/api/vibe/saved')
      .then((r) => r.ok ? r.json() : { saved: [] })
      .then((d) => setSavedVibes(d.saved ?? []))
      .catch(() => {});
  }, []);

  // Read URL params on mount (for "find books like this" deep-link)
  useEffect(() => {
    const paramMode = searchParams.get('mode');
    const paramVibe = searchParams.get('vibe');
    if (paramMode === 'vibe' && paramVibe) {
      setMode('vibe');
      setQuery(paramVibe);
      triggerVibeSearch(paramVibe, EMPTY_MOODS, [], '');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  }, []);

  async function triggerVibeSearch(
    q: string,
    m: MoodFilters,
    exclude: string[],
    refine: string,
    append = false,
  ) {
    if (!q.trim()) return;
    const id = ++requestIdRef.current;
    setLoading(true);
    if (!append) {
      setSearched(true);
      setError(null);
      setActiveQuery(q.trim());
      setIsSaved(false);
      setSavedId(null);
    }
    try {
      const res = await fetch('/api/vibe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q.trim(), moods: m, exclude, refinement: refine }),
      });
      if (id !== requestIdRef.current) return;
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? 'Something went wrong. Please try again.');
        if (!append) setVibeResults([]);
        return;
      }
      const data: { items: VibeBook[] } = await res.json();
      const newItems = data.items ?? [];
      if (append) {
        setVibeResults((prev) => [...prev, ...newItems]);
        setExcludedIds((prev) => [...prev, ...newItems.map((b) => b.id)]);
      } else {
        setVibeResults(newItems);
        setExcludedIds(newItems.map((b) => b.id));
      }
    } catch {
      if (id === requestIdRef.current) {
        setError('Could not connect. Please try again.');
        if (!append) setVibeResults([]);
      }
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }

  const vibeSearch = useCallback((q: string, m: MoodFilters) => {
    return triggerVibeSearch(q, m, [], '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (mode === 'keyword') search(query);
    else {
      setPage(0);
      setExcludedIds([]);
      setShowRefine(false);
      setRefinement('');
      vibeSearch(query, moods);
    }
  }

  function reset() {
    setSearched(false);
    setResults([]);
    setVibeResults([]);
    setError(null);
    setQuery('');
    setMoods(EMPTY_MOODS);
    setShowRefine(false);
    setRefinement('');
    setIsSaved(false);
    setSavedId(null);
    setExcludedIds([]);
    setPage(0);
  }

  function switchMode(m: SearchMode) {
    setMode(m);
    reset();
  }

  async function handleSaveToggle() {
    if (isSaved && savedId) {
      await fetch(`/api/vibe/saved?id=${savedId}`, { method: 'DELETE' });
      setSavedVibes((prev) => prev.filter((v) => v.id !== savedId));
      setIsSaved(false);
      setSavedId(null);
    } else {
      const res = await fetch('/api/vibe/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery, moods }),
      });
      if (res.ok) {
        const { saved } = await res.json();
        setSavedVibes((prev) => [saved, ...prev]);
        setIsSaved(true);
        setSavedId(saved.id);
      }
    }
  }

  async function handleShare() {
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'vibe');
    url.searchParams.set('vibe', activeQuery);
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopyMsg('Link copied!');
      setTimeout(() => setCopyMsg(null), 2000);
    } catch {
      setCopyMsg('Could not copy');
      setTimeout(() => setCopyMsg(null), 2000);
    }
  }

  function handleRefineSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!refinement.trim()) return;
    triggerVibeSearch(activeQuery, moods, excludedIds, refinement);
    setShowRefine(false);
    setRefinement('');
  }

  function handleLoadMore() {
    setPage((p) => p + 1);
    triggerVibeSearch(activeQuery, moods, excludedIds, '', true);
  }

  function toggleMood<K extends keyof MoodFilters>(key: K, val: MoodFilters[K]) {
    setMoods((prev) => ({ ...prev, [key]: prev[key] === val ? null : val }));
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
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
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

      {/* Mood filters (vibe mode only, pre-search or between searches) */}
      {mode === 'vibe' && (
        <div className="flex flex-wrap gap-2 mb-5">
          {/* Tone */}
          {(['dark', 'light'] as const).map((v) => (
            <button
              key={v}
              onClick={() => toggleMood('tone', v)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                moods.tone === v
                  ? 'bg-btn text-btn-fg border-transparent'
                  : 'bg-surface border-subtle text-secondary hover:border-default hover:text-primary'
              }`}
            >
              {v === 'dark' ? '🌑 Dark' : '☀️ Light'}
            </button>
          ))}
          {/* Pace */}
          {(['fast', 'slow'] as const).map((v) => (
            <button
              key={v}
              onClick={() => toggleMood('pace', v)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                moods.pace === v
                  ? 'bg-btn text-btn-fg border-transparent'
                  : 'bg-surface border-subtle text-secondary hover:border-default hover:text-primary'
              }`}
            >
              {v === 'fast' ? '⚡ Fast-paced' : '🐢 Slow-burn'}
            </button>
          ))}
          {/* Length */}
          {(['short', 'long'] as const).map((v) => (
            <button
              key={v}
              onClick={() => toggleMood('length', v)}
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                moods.length === v
                  ? 'bg-btn text-btn-fg border-transparent'
                  : 'bg-surface border-subtle text-secondary hover:border-default hover:text-primary'
              }`}
            >
              {v === 'short' ? '📄 Short' : '📚 Long'}
            </button>
          ))}
        </div>
      )}

      {/* Vibe example prompts (pre-search) */}
      {mode === 'vibe' && !searched && (
        <div className="mb-8">
          {/* Saved vibes */}
          {savedVibes.length > 0 && (
            <div className="mb-5">
              <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-2">Saved searches</p>
              <div className="flex flex-wrap gap-2">
                {savedVibes.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => { setQuery(v.query); setMoods(v.moods); vibeSearch(v.query, v.moods); }}
                    className="text-xs px-3 py-1.5 bg-accent-soft border border-[var(--link)]/20 text-link rounded-full hover:bg-[var(--link)]/10 transition-all"
                  >
                    ✦ {v.query}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted uppercase tracking-widest font-semibold mb-3">Try asking for…</p>
          <div className="flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => { setQuery(prompt); vibeSearch(prompt, moods); }}
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

      {/* ── Error ── */}
      {!loading && error && (
        <div className="text-center py-16">
          <p className="text-3xl mb-3 opacity-40">⚠</p>
          <p className="text-secondary text-sm">{error}</p>
        </div>
      )}

      {/* ── No results ── */}
      {!loading && searched && !error && !hasResults && (
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
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted">
              Best matches for &ldquo;{activeQuery}&rdquo;
            </p>
            <div className="flex items-center gap-3">
              {/* Share */}
              <button
                onClick={handleShare}
                className="text-xs text-muted hover:text-primary transition-colors"
                title="Share this vibe"
              >
                {copyMsg ?? '↗ Share'}
              </button>
              {/* Save */}
              <button
                onClick={handleSaveToggle}
                className={`text-xs transition-colors ${
                  isSaved ? 'text-link' : 'text-muted hover:text-primary'
                }`}
                title={isSaved ? 'Unsave this vibe' : 'Save this vibe'}
              >
                {isSaved ? '★ Saved' : '☆ Save'}
              </button>
              {/* Reset */}
              <button
                onClick={reset}
                className="text-xs text-muted hover:text-primary transition-colors"
              >
                ← Try another
              </button>
            </div>
          </div>

          {/* Book list */}
          <div className="space-y-3">
            {vibeResults.map((book, i) => (
              <Link
                key={`${book.id}-${i}`}
                href={`/books/${book.id}`}
                className="flex gap-4 p-4 bg-surface border border-subtle rounded-2xl hover:border-default transition-all group shadow-sm shadow-black/5 hover:shadow-md hover:shadow-black/8"
              >
                <div className="shrink-0 w-5 flex items-start pt-0.5">
                  <span className="text-xs font-semibold text-muted tabular-nums">{i + 1}</span>
                </div>
                <div className="shrink-0" style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
                  <BookCover coverUrl={book.cover_url} title={book.title} author={book.authors?.[0]} isbn={book.isbn_13} width={52} height={78} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-semibold text-primary text-[15px] leading-snug group-hover:text-link transition-colors line-clamp-2 mb-0.5">
                    {book.title}
                  </h3>
                  {book.authors?.[0] && (
                    <p className="text-xs text-secondary italic mb-2">{book.authors[0]}</p>
                  )}
                  {book.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {book.genres.map((g) => (
                        <span
                          key={g}
                          className="text-[10px] font-medium px-2 py-0.5 bg-accent-soft text-link rounded-full border border-[var(--link)]/20"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  {book.reason && (
                    <p className="text-xs text-muted leading-relaxed line-clamp-2">{book.reason}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Actions below results */}
          <div className="mt-6 space-y-3">
            {/* Refinement */}
            {!showRefine ? (
              <button
                onClick={() => setShowRefine(true)}
                className="w-full py-2.5 text-sm text-secondary border border-subtle rounded-xl hover:border-default hover:text-primary transition-all"
              >
                Not quite right? Refine these results →
              </button>
            ) : (
              <form onSubmit={handleRefineSubmit} className="flex gap-2">
                <input
                  autoFocus
                  type="text"
                  value={refinement}
                  onChange={(e) => setRefinement(e.target.value)}
                  placeholder="e.g. more uplifting, set in Japan, shorter books…"
                  className="flex-1 px-4 py-2.5 bg-input border border-input rounded-xl text-sm text-primary focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent placeholder:text-muted"
                />
                <button
                  type="submit"
                  disabled={!refinement.trim()}
                  className="px-4 py-2.5 bg-btn text-btn-fg rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  Refine
                </button>
                <button
                  type="button"
                  onClick={() => { setShowRefine(false); setRefinement(''); }}
                  className="px-3 py-2.5 text-sm text-muted hover:text-primary transition-colors"
                >
                  ✕
                </button>
              </form>
            )}

            {/* Load more */}
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-2.5 text-sm text-secondary border border-subtle rounded-xl hover:border-default hover:text-primary transition-all disabled:opacity-40"
            >
              {loading ? 'Loading…' : 'Load more recommendations'}
            </button>
          </div>
        </>
      )}

      {/* ── Category browse (pre-search, keyword mode) ── */}
      {!searched && mode === 'keyword' && (
        <div className="space-y-8">
          {initialCategories.length === 0 ? (
            <p className="text-sm text-muted text-center py-8">
              Search for a book to get started.
            </p>
          ) : (
            initialCategories.map((cat) => (
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
                          author={book.authors?.[0]}
                          isbn={book.isbn_13}
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
          )}
        </div>
      )}
    </div>
  );
}
