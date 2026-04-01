import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { embedBatch, cosineSimilarity } from '@/lib/embeddings';
import { olSearchDocToBook } from '@/lib/utils';
import type { OLSearchResponse, OLSearchDoc, Book } from '@/types';

interface VibeResult extends Book {
  score: number;
  matchedSubjects: string[];
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

  // 1. Fetch 40 candidate books from Open Library
  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', query);
  url.searchParams.set(
    'fields',
    'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn'
  );
  url.searchParams.set('limit', '40');

  const olRes = await fetch(url.toString());
  if (!olRes.ok) {
    return NextResponse.json({ error: 'Open Library error' }, { status: 502 });
  }

  const olData: OLSearchResponse = await olRes.json();
  const docs = olData.docs ?? [];

  if (docs.length === 0) {
    return NextResponse.json({ items: [] });
  }

  // 2. Build semantic texts (query first, then each book)
  const bookTexts = docs.map(buildSemanticText);
  const allTexts = [query, ...bookTexts];

  // 3. Single batch embedding call
  let embeddings: number[][];
  try {
    embeddings = await embedBatch(allTexts);
  } catch (err) {
    console.error('Embedding error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Embedding failed' }, { status: 500 });
  }

  const queryEmbedding = embeddings[0];
  const bookEmbeddings = embeddings.slice(1);

  // 4. Score + rank
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
