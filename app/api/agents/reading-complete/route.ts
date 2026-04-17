import { after } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 30;

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  // Auth via user session (called from the client after marking a book read)
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const finishedBookId: string = body?.bookId;
  if (!finishedBookId) return NextResponse.json({ error: 'Missing bookId' }, { status: 400 });

  // Respond immediately, run Claude in the background
  after(async () => {
    await runAgent(user.id, finishedBookId);
  });

  return NextResponse.json({ ok: true });
}

// ── Agent logic ───────────────────────────────────────────────────────────────
async function runAgent(userId: string, finishedBookId: string) {
  const supabase = createAdminClient();

  const [{ data: finishedBook }, { data: wantToReadRows }, { data: lovedRows }] =
    await Promise.all([
      supabase.from('books').select('id, title, authors').eq('id', finishedBookId).single(),
      supabase
        .from('user_books')
        .select('book:books(id, title, authors)')
        .eq('user_id', userId)
        .eq('shelf', 'want_to_read')
        .order('updated_at', { ascending: false })
        .limit(15),
      supabase
        .from('user_books')
        .select('rating, book:books(title, authors)')
        .eq('user_id', userId)
        .gte('rating', 4)
        .order('updated_at', { ascending: false })
        .limit(8),
    ]);

  type BookRow = { id: string; title: string; authors: string[] | null };
  type WantRow = { book: BookRow | null };
  type LovedRow = { rating: number; book: { title: string; authors: string[] | null } | null };

  const wantList = ((wantToReadRows ?? []) as unknown as WantRow[])
    .map((r) => r.book)
    .filter((b): b is BookRow => !!b);

  if (!finishedBook || wantList.length === 0) {
    console.log('Agent: skipped — no finished book or empty want-to-read shelf');
    return;
  }

  const lovedLines = ((lovedRows ?? []) as unknown as LovedRow[])
    .map((r) => r.book ? `"${r.book.title}" by ${r.book.authors?.[0] ?? 'Unknown'} (${r.rating}★)` : null)
    .filter(Boolean).join('\n');

  const wantLines = wantList
    .map((b) => `- id:${b.id} | "${b.title}" by ${b.authors?.[0] ?? 'Unknown'}`)
    .join('\n');

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) { console.error('Agent: missing SUPABASE_SERVICE_ROLE_KEY'); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { console.error('Agent: missing ANTHROPIC_API_KEY'); return; }

  const prompt = `A reader just finished "${finishedBook.title}"${finishedBook.authors?.[0] ? ` by ${finishedBook.authors[0]}` : ''}.

Their want-to-read shelf:
${wantLines}

Books they have loved (4–5★):
${lovedLines || 'None yet'}

Pick the ONE book from their want-to-read list they should read next. Write a warm, personal 2-sentence message explaining why — like a friend who knows their taste.

Return ONLY valid JSON:
{"book_id": "<exact id from list>", "book_title": "<exact title>", "message": "<recommendation>"}`;

  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
    signal: AbortSignal.timeout(25000),
  });

  if (!claudeRes.ok) { console.error('Agent: Claude error', claudeRes.status); return; }

  const claudeData = await claudeRes.json();
  const rawText: string = claudeData.content?.[0]?.text ?? '{}';
  const json = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let rec: { book_id: string; book_title: string; message: string };
  try { rec = JSON.parse(json); }
  catch { console.error('Agent: failed to parse Claude response', rawText); return; }

  const validBook = wantList.find((b) => b.id === rec.book_id);
  if (!validBook) { console.warn('Agent: Claude picked unknown book_id:', rec.book_id); return; }

  const { error } = await supabase.from('notifications').insert({
    user_id:             userId,
    type:                'reading_complete',
    message:             rec.message,
    finished_book_id:    finishedBookId,
    recommended_book_id: rec.book_id,
    book_title:          rec.book_title,
  });

  if (error) { console.error('Agent: insert failed', error.message); return; }
  console.log(`Agent: done — recommended "${validBook.title}" to user ${userId}`);
}
