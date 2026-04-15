import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchLongitoodCover } from '@/lib/bookcover';
import { olSearchDocToBook } from '@/lib/utils';
import type { OLSearchDoc, OLSearchResponse, Book, MoodFilters } from '@/types';

interface VibeResult extends Book {
  reason: string;
  genres: string[];
}

interface LLMBook {
  title: string;
  author: string;
  reason: string;
  genres: string[];
}

// ── Title matching ────────────────────────────────────────────────────────────
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

/** Word-overlap: 40%+ of the suggested title's words appear in the found title */
function titlesMatch(suggested: string, found: string): boolean {
  const a = normalizeTitle(suggested).split(/\s+/).filter(Boolean);
  const b = new Set(normalizeTitle(found).split(/\s+/).filter(Boolean));
  if (a.length === 0) return false;
  return a.filter((w) => b.has(w)).length / a.length >= 0.4;
}

async function searchOL(q: string): Promise<OLSearchDoc[]> {
  try {
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', q);
    url.searchParams.set('fields', 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn');
    url.searchParams.set('limit', '5');
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data: OLSearchResponse = await res.json();
    return data.docs ?? [];
  } catch {
    return [];
  }
}

async function lookupOnOL(book: LLMBook): Promise<OLSearchDoc | null> {
  // Try title + author first
  const docs = await searchOL(`${book.title} ${book.author}`);
  const match = docs.find((doc) => titlesMatch(book.title, doc.title));
  if (match) return match;
  // Fallback: title only
  const titleDocs = await searchOL(book.title);
  return titleDocs.find((doc) => titlesMatch(book.title, doc.title)) ?? null;
}

// ── Cache key ─────────────────────────────────────────────────────────────────
async function makeCacheKey(query: string, moods: MoodFilters): Promise<string> {
  const raw = JSON.stringify({ query: query.toLowerCase().trim(), moods });
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Shelf context ─────────────────────────────────────────────────────────────
interface ShelfContext {
  topRated: Array<{ title: string; author: string; rating: number }>;
  recentlyRead: Array<{ title: string; author: string }>;
  allTitles: Set<string>;
}

async function getUserShelfContext(userId: string): Promise<ShelfContext> {
  const { createClient: createSB } = await import('@/lib/supabase/server');
  const supabase = await createSB();

  const { data } = await supabase
    .from('user_books')
    .select('rating, shelf, book:books(title, authors)')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);

  const rows = (data ?? []) as unknown as Array<{
    rating: number | null;
    shelf: string;
    book: { title: string; authors: string[] | null } | null;
  }>;

  const topRated = rows
    .filter((r) => r.rating && r.rating >= 4 && r.book)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, 8)
    .map((r) => ({ title: r.book!.title, author: r.book!.authors?.[0] ?? 'Unknown', rating: r.rating! }));

  const recentlyRead = rows
    .filter((r) => r.shelf === 'read' && r.book)
    .slice(0, 6)
    .map((r) => ({ title: r.book!.title, author: r.book!.authors?.[0] ?? 'Unknown' }));

  const allTitles = new Set(rows.filter((r) => r.book).map((r) => normalizeTitle(r.book!.title)));

  return { topRated, recentlyRead, allTitles };
}

function buildShelfBlock(ctx: ShelfContext): string {
  const lines: string[] = [];
  if (ctx.topRated.length > 0) {
    lines.push('Books this user has loved (rated 4–5★):');
    ctx.topRated.forEach((b) => lines.push(`  - "${b.title}" by ${b.author} (${b.rating}★)`));
  }
  if (ctx.recentlyRead.length > 0) {
    lines.push('Recently read (do NOT recommend these):');
    ctx.recentlyRead.forEach((b) => lines.push(`  - "${b.title}" by ${b.author}`));
  }
  return lines.join('\n');
}

// ── Mood instructions ─────────────────────────────────────────────────────────
function buildMoodBlock(moods: MoodFilters): string {
  const constraints: string[] = [];
  if (moods.tone === 'dark') constraints.push('tone must be dark, heavy, or bleak — avoid light or uplifting books');
  if (moods.tone === 'light') constraints.push('tone must be light, warm, or uplifting — avoid dark or heavy books');
  if (moods.pace === 'fast') constraints.push('pace must be fast — plot-driven, hard to put down');
  if (moods.pace === 'slow') constraints.push('pace must be slow and contemplative — atmospheric, character-driven');
  if (moods.length === 'short') constraints.push('books should be short (under 250 pages) or novellas');
  if (moods.length === 'long') constraints.push('books should be long (400+ pages) — epic or expansive reads');
  if (constraints.length === 0) return '';
  return 'Additional mood constraints:\n' + constraints.map((c) => `  - ${c}`).join('\n');
}

// ── Claude call with one retry on 5xx ────────────────────────────────────────
async function callClaude(apiKey: string, prompt: string): Promise<LLMBook[]> {
  const payload = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  };
  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json',
  };

  async function attempt(): Promise<Response> {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  }

  let res = await attempt();
  if (!res.ok && res.status >= 500) {
    console.warn('Claude 5xx, retrying once…', res.status);
    res = await attempt();
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Claude ${res.status}: ${body}`);
  }

  const data = await res.json();
  const content: string = data.content?.[0]?.text ?? '{}';
  const json = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed: unknown = JSON.parse(json);
  if (typeof parsed !== 'object' || parsed === null) throw new Error('Bad response shape');
  const books = (parsed as Record<string, unknown>).books;
  if (!Array.isArray(books)) throw new Error('No books array in response');
  return books as LLMBook[];
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const query: string = body?.query?.trim() ?? '';
  if (!query) return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  if (query.length > 500) return NextResponse.json({ error: 'Query too long' }, { status: 400 });

  const moods: MoodFilters = {
    tone:   body?.moods?.tone   ?? null,
    pace:   body?.moods?.pace   ?? null,
    length: body?.moods?.length ?? null,
  };
  const exclude: string[] = Array.isArray(body?.exclude) ? body.exclude.map(normalizeTitle) : [];
  const refinement: string = body?.refinement?.trim() ?? '';

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'AI service not configured' }, { status: 503 });

  // ── Cache check ───────────────────────────────────────────────────────────
  const cacheKey = await makeCacheKey(query + refinement, moods);
  if (!refinement && exclude.length === 0) {
    const { data: cached } = await supabase
      .from('vibe_cache')
      .select('items, expires_at')
      .eq('cache_key', cacheKey)
      .single();
    if (cached && new Date(cached.expires_at) > new Date()) {
      return NextResponse.json({ items: cached.items, cached: true });
    }
  }

  // ── Shelf context — best-effort ───────────────────────────────────────────
  let shelfCtx: ShelfContext = { topRated: [], recentlyRead: [], allTitles: new Set() };
  try { shelfCtx = await getUserShelfContext(user.id); } catch { /* continue */ }
  const shelfBlock = buildShelfBlock(shelfCtx);
  const moodBlock = buildMoodBlock(moods);

  const allExcludeTitles = new Set([...shelfCtx.allTitles, ...exclude]);

  const prompt = `You are an expert book recommender with deep knowledge of literary fiction, genre fiction, and non-fiction.

${shelfBlock ? `${shelfBlock}\n\n` : ''}${moodBlock ? `${moodBlock}\n\n` : ''}Vibe the user is looking for: "${query}"${refinement ? `\n\nRefinement (the user wants to adjust results): "${refinement}"` : ''}

Recommend 25 real published books that match this vibe. Prioritise books that suit the user's taste. Include a mix of well-known and lesser-known titles. Avoid the most obvious/clichéd picks.

Return ONLY a JSON object in exactly this format, no other text or markdown:
{"books": [{"title": "exact title", "author": "exact author name", "reason": "one short sentence explaining why this fits the vibe", "genres": ["Genre", "Genre"]}]}

genres: 2–3 short clean tags (e.g. "Literary Fiction", "Dark Humour", "Psychological Thriller"). Max 3.`;

  // ── Step 1: Claude ────────────────────────────────────────────────────────
  let suggestions: LLMBook[];
  try {
    suggestions = await callClaude(apiKey, prompt);
  } catch (err) {
    console.error('Claude error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not generate recommendations. Please try again.' }, { status: 503 });
  }

  // ── Step 2: Validate against Open Library (parallel) ─────────────────────
  const docs = await Promise.all(suggestions.slice(0, 25).map(lookupOnOL));

  // ── Step 3: Build book objects, skip excluded/shelf books ─────────────────
  const validated: Array<{ book: Book; reason: string; genres: string[] }> = [];
  docs.forEach((doc, i) => {
    if (!doc || validated.length >= 10) return;
    const book = olSearchDocToBook(doc);
    if (allExcludeTitles.has(normalizeTitle(book.title))) return;
    validated.push({ book, reason: suggestions[i]?.reason ?? '', genres: suggestions[i]?.genres ?? [] });
  });

  // ── Step 4: Fill missing covers via longitood (parallel) ──────────────────
  const items: VibeResult[] = await Promise.all(
    validated.map(async ({ book, reason, genres }) => {
      let cover_url = book.cover_url;
      if (!cover_url) {
        cover_url = await fetchLongitoodCover(book.title, book.authors?.[0] ?? null, book.isbn_13);
      }
      return { ...book, cover_url, reason, genres } satisfies VibeResult;
    })
  );

  // ── Step 5: Write to cache (skip if refinement or exclude) ────────────────
  if (!refinement && exclude.length === 0 && items.length > 0) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour TTL
    await supabase.from('vibe_cache').upsert({
      cache_key: cacheKey,
      items,
      expires_at: expiresAt,
    }, { onConflict: 'cache_key' }).then(() => {});
  }

  return NextResponse.json({ items });
}
