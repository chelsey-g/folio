import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding, bookEmbeddingText } from '@/lib/embeddings';
import type { Book } from '@/types';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  // Book metadata passed from the page (avoids a round-trip to OL)
  const title       = searchParams.get('title') ?? '';
  const description = searchParams.get('description') ?? '';
  const authors     = searchParams.getAll('authors');
  const categories  = searchParams.getAll('categories');

  // ── Step 1: Check for a cached embedding ─────────────────────────────────
  const { data: row } = await supabase
    .from('books')
    .select('embedding')
    .eq('id', id)
    .maybeSingle();

  let embedding: number[] | null = (row?.embedding as number[] | null) ?? null;

  // ── Step 2: Generate if missing ───────────────────────────────────────────
  if (!embedding) {
    const text = bookEmbeddingText({ title, authors, categories, description });
    embedding = await generateEmbedding(text);

    if (embedding) {
      // Store so the next request is instant — fire-and-forget
      supabase
        .from('books')
        .update({ embedding: JSON.stringify(embedding) })
        .eq('id', id)
        .then(() => {});
    }
  }

  if (!embedding) {
    // No API key or generation failed — return empty gracefully
    return NextResponse.json({ items: [], source: 'none' });
  }

  // ── Step 3: Vector similarity search ─────────────────────────────────────
  const { data: matches, error } = await supabase.rpc('match_books', {
    query_embedding: JSON.stringify(embedding),
    exclude_id: id,
    match_count: 8,
  });

  if (error || !matches?.length) {
    return NextResponse.json({ items: [], source: 'embedding' });
  }

  // ── Step 4: Fetch full book rows for matched IDs ──────────────────────────
  const matchIds: string[] = matches.map((m: { id: string }) => m.id);

  const { data: books } = await supabase
    .from('books')
    .select('*')
    .in('id', matchIds);

  // Preserve similarity order from the vector search
  const bookMap = new Map<string, Book>((books ?? []).map((b) => [b.id, b as Book]));
  const items = matchIds.map((mid) => bookMap.get(mid)).filter((b): b is Book => !!b);

  return NextResponse.json({ items, source: 'embedding' });
}
