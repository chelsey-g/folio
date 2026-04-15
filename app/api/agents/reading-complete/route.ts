import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// ── Supabase webhook payload shape ────────────────────────────────────────────
interface WebhookPayload {
  type: string;
  table: string;
  record: {
    user_id: string;
    book_id: string;
    shelf: string;
    [key: string]: unknown;
  };
  old_record: {
    shelf: string;
    [key: string]: unknown;
  } | null;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(request: Request) {

  // 1. Verify this is genuinely from Supabase
  const secret = request.headers.get('x-agent-secret');
  if (!secret || secret !== process.env.AGENT_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse payload
  const payload: WebhookPayload = await request.json();

  // Only act when a row transitions INTO 'read' (not already read, not other shelves)
  if (
    payload.table   !== 'user_books'      ||
    payload.record?.shelf !== 'read'      ||
    payload.old_record?.shelf === 'read'
  ) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { user_id: userId, book_id: finishedBookId } = payload.record;
  const supabase = createAdminClient();

  // 3. Fetch context in parallel
  const [
    { data: finishedBook },
    { data: wantToReadRows },
    { data: lovedRows },
  ] = await Promise.all([
    supabase
      .from('books')
      .select('id, title, authors, categories')
      .eq('id', finishedBookId)
      .single(),

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
    return NextResponse.json({ ok: true, skipped: 'insufficient context' });
  }

  const lovedList = ((lovedRows ?? []) as unknown as LovedRow[])
    .map((r) => r.book ? `"${r.book.title}" by ${r.book.authors?.[0] ?? 'Unknown'} (${r.rating}★)` : null)
    .filter(Boolean)
    .join('\n');

  const wantLines = wantList
    .map((b) => `- id:${b.id} | "${b.title}" by ${b.authors?.[0] ?? 'Unknown'}`)
    .join('\n');

  // 4. Ask Claude to pick the next book and write a recommendation
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'No Anthropic API key' }, { status: 503 });

  const prompt = `A reader just finished "${finishedBook.title}"${finishedBook.authors?.[0] ? ` by ${finishedBook.authors[0]}` : ''}.

Their want-to-read shelf:
${wantLines}

Books they have loved (4–5★ ratings):
${lovedList || 'None yet'}

Your job: pick the ONE book from their want-to-read list they should read next, and write a warm, personal 2-sentence message explaining why — like a friend who genuinely knows their taste. Reference specific things about what they just read or what they love.

Return ONLY valid JSON, no other text:
{"book_id": "<exact id from the list>", "book_title": "<exact title>", "message": "<your recommendation>"}`;

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
    signal: AbortSignal.timeout(20000),
  });

  if (!claudeRes.ok) {
    console.error('Agent: Claude error', claudeRes.status);
    return NextResponse.json({ error: 'Claude failed' }, { status: 503 });
  }

  const claudeData = await claudeRes.json();
  const rawText: string = claudeData.content?.[0]?.text ?? '{}';
  const json = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  let recommendation: { book_id: string; book_title: string; message: string };
  try {
    recommendation = JSON.parse(json);
  } catch {
    console.error('Agent: failed to parse Claude response', rawText);
    return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
  }

  // Validate Claude picked a real book from the list
  const validBook = wantList.find((b) => b.id === recommendation.book_id);
  if (!validBook) {
    console.warn('Agent: Claude picked unknown book_id, skipping notification');
    return NextResponse.json({ ok: true, skipped: 'invalid book_id' });
  }

  // 5. Store the notification
  const { error: insertErr } = await supabase.from('notifications').insert({
    user_id:             userId,
    type:                'reading_complete',
    message:             recommendation.message,
    finished_book_id:    finishedBookId,
    recommended_book_id: recommendation.book_id,
    book_title:          recommendation.book_title,
  });

  if (insertErr) {
    console.error('Agent: failed to insert notification', insertErr.message);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  console.log(`Agent: notified user ${userId} → read "${validBook.title}" next`);
  return NextResponse.json({ ok: true });
}
