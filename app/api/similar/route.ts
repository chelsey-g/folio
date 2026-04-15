import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding, bookEmbeddingText } from '@/lib/embeddings';
import { olSearchDocToBook } from '@/lib/utils';
import type { Book, OLSearchDoc, OLSearchResponse } from '@/types';

// ── OL helpers (mirrors vibe route) ──────────────────────────────────────────
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

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

async function lookupOnOL(title: string, author: string): Promise<OLSearchDoc | null> {
  const docs = await searchOL(`${title} ${author}`);
  const match = docs.find((doc) => titlesMatch(title, doc.title));
  if (match) return match;
  const titleDocs = await searchOL(title);
  return titleDocs.find((doc) => titlesMatch(title, doc.title)) ?? null;
}

// ── Claude fallback ───────────────────────────────────────────────────────────
interface LLMBook { title: string; author: string }

async function getSimilarViaClaude(
  title: string,
  authors: string[],
  categories: string[],
  description: string,
  apiKey: string,
): Promise<Book[]> {
  const authorStr  = authors.length  ? ` by ${authors[0]}` : '';
  const genreStr   = categories.length ? ` (${categories.slice(0, 2).join(', ')})` : '';
  const descSnip   = description ? `\n\nSynopsis: ${description.replace(/<[^>]+>/g, '').slice(0, 300)}` : '';

  const prompt = `You are an expert book recommender.

Find 12 real published books that are genuinely similar to: "${title}"${authorStr}${genreStr}${descSnip}

Return ONLY a JSON object, no other text:
{"books": [{"title": "exact title", "author": "exact author name"}]}

List exactly 8 books.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];

    const data = await res.json();
    const text: string = data.content?.[0]?.text ?? '{}';
    const json = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(json) as { books: LLMBook[] };
    if (!Array.isArray(parsed.books)) return [];

    // Validate against OL in parallel — stop collecting after 5 valid results
    const excluded = new Set([normalizeTitle(title)]);
    const results: Book[] = [];

    await Promise.all(
      parsed.books.slice(0, 8).map(async (b) => {
        if (results.length >= 5) return;
        const doc = await lookupOnOL(b.title, b.author);
        if (!doc || results.length >= 5) return;
        const book = olSearchDocToBook(doc);
        if (excluded.has(normalizeTitle(book.title))) return;
        if (results.length >= 5) return;
        excluded.add(normalizeTitle(book.title));
        results.push(book);
      })
    );
    return results;
  } catch {
    return [];
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const title       = searchParams.get('title') ?? '';
  const description = searchParams.get('description') ?? '';
  const authors     = searchParams.getAll('authors');
  const categories  = searchParams.getAll('categories');

  // ── Try vector search first ───────────────────────────────────────────────
  let items: Book[] = [];

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey) {
    const { data: row } = await supabase
      .from('books')
      .select('embedding')
      .eq('id', id)
      .maybeSingle();

    let embedding: number[] | null = (row?.embedding as number[] | null) ?? null;

    if (!embedding) {
      const text = bookEmbeddingText({ title, authors, categories, description });
      embedding = await generateEmbedding(text);
      if (embedding) {
        supabase
          .from('books')
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', id)
          .then(() => {});
      }
    }

    if (embedding) {
      const { data: matches } = await supabase.rpc('match_books', {
        query_embedding: JSON.stringify(embedding),
        exclude_id: id,
        match_count: 8,
      });

      if (matches?.length) {
        const matchIds: string[] = matches.map((m: { id: string }) => m.id);
        const { data: books } = await supabase.from('books').select('*').in('id', matchIds);
        const bookMap = new Map<string, Book>((books ?? []).map((b) => [b.id, b as Book]));
        items = matchIds.map((mid) => bookMap.get(mid)).filter((b): b is Book => !!b);
      }
    }
  }

  // ── Fall back to Claude if not enough embedding results ───────────────────
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (items.length < 3 && anthropicKey) {
    items = await getSimilarViaClaude(title, authors, categories, description, anthropicKey);
  }

  return NextResponse.json({ items, source: items.length > 0 ? 'claude' : 'none' });
}
