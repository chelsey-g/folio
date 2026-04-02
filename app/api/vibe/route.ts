import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedBatch, cosineSimilarity } from '@/lib/embeddings';
import { olSearchDocToBook } from '@/lib/utils';
import type { OLSearchResponse, OLSearchDoc, Book } from '@/types';

interface VibeResult extends Book {
  score: number;
  matchedSubjects: string[];
}

// Stop words to strip when building the OL keyword query
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'about','by','from','is','it','its','that','this','was','are','be','been',
  'have','has','i','me','my','we','you','your','he','she','they','set','feel',
  'like','want','looking','something','story','stories','book','books','novel',
  'novels','written','literary','writing','read','reading','fiction','nonfiction',
  'genre','type','kind','style','very','really','quite','more','some','any',
]);

/**
 * Extract meaningful keywords from a natural-language vibe query.
 * "a quiet novel about grief set in Scandinavia" → "quiet grief Scandinavia"
 */
function extractKeywords(query: string): string {
  const words = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  // Deduplicate and take up to 5 most meaningful terms
  const unique = [...new Set(words)].slice(0, 5);
  return unique.join(' ');
}

function buildSemanticText(doc: OLSearchDoc): string {
  const parts: string[] = [];
  parts.push(doc.title);
  if (doc.author_name?.length) parts.push(doc.author_name.join(', '));
  if (doc.subject?.length) parts.push(doc.subject.join(', '));
  return parts.join('. ');
}

function matchedSubjects(query: string, subjects: string[]): string[] {
  const queryWords = new Set(
    query.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  );
  return subjects.filter((s) =>
    s.toLowerCase().split(/\W+/).some((w) => queryWords.has(w))
  );
}

export async function POST(request: Request) {
  // Auth guard — prevents unauthenticated callers from triggering paid OpenAI calls
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const query: string = body?.query?.trim() ?? '';
  if (!query) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }
  if (query.length > 500) {
    return NextResponse.json({ error: 'Query too long' }, { status: 400 });
  }

  // 1. Extract keywords for OL candidate search
  const keywords = extractKeywords(query);
  if (!keywords) {
    return NextResponse.json({ error: 'Could not extract keywords from query' }, { status: 400 });
  }

  // 2. Fetch candidate books from Open Library using extracted keywords
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', keywords);
  url.searchParams.set(
    'fields',
    'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn'
  );
  url.searchParams.set('limit', '40');

  let olData: OLSearchResponse;
  try {
    const olRes = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!olRes.ok) {
      console.error(`Open Library returned ${olRes.status} for keywords: "${keywords}"`);
      return NextResponse.json(
        { error: 'Book database is temporarily unavailable. Try again in a moment.' },
        { status: 503 }
      );
    }
    olData = await olRes.json();
  } catch (err) {
    console.error('Open Library fetch failed:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Book database is temporarily unavailable. Try again in a moment.' },
      { status: 503 }
    );
  }

  const docs = olData.docs ?? [];
  if (docs.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // 3. Build semantic texts (query first, then each book)
  const bookTexts = docs.map(buildSemanticText);
  const allTexts = [query, ...bookTexts];

  // 4. Single batch embedding call
  let embeddings: number[][];
  try {
    embeddings = await embedBatch(allTexts);
  } catch (err) {
    console.error('Embedding error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
  }

  const queryEmbedding = embeddings[0];
  const bookEmbeddings = embeddings.slice(1);

  // 5. Score + rank
  const scored = docs.map((doc, i) => {
    const book = olSearchDocToBook(doc);
    const score = cosineSimilarity(queryEmbedding, bookEmbeddings[i]);
    const matched = matchedSubjects(query, doc.subject ?? []);
    return { ...book, score, matchedSubjects: matched } satisfies VibeResult;
  });

  scored.sort((a, b) => b.score - a.score);
  const top10 = scored.slice(0, 10);

  return NextResponse.json({ items: top10 });
}
