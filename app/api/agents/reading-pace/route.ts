import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const currentYear = now.getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const daysIntoYear = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const daysLeftInYear = 365 - daysIntoYear;

  // All users with a reading goal set
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, reading_goal')
    .not('reading_goal', 'is', null)
    .gt('reading_goal', 0);

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, notified: 0 });
  }

  const userIds = profiles.map((p) => p.id);

  // Fetch currently reading books + read-this-year counts for all users in parallel
  const [{ data: currentlyReadingRows }, { data: readThisYearRows }] = await Promise.all([
    supabase
      .from('user_books')
      .select('user_id, book:books(title)')
      .in('user_id', userIds)
      .eq('shelf', 'reading'),
    supabase
      .from('user_books')
      .select('user_id')
      .in('user_id', userIds)
      .eq('shelf', 'read')
      .gte('finished_at', startOfYear.toISOString()),
  ]);

  type CRRow = { user_id: string; book: { title: string } | null };

  const readingByUser = new Map<string, CRRow[]>();
  for (const row of (currentlyReadingRows ?? []) as unknown as CRRow[]) {
    if (!readingByUser.has(row.user_id)) readingByUser.set(row.user_id, []);
    readingByUser.get(row.user_id)!.push(row);
  }

  const readCountByUser = new Map<string, number>();
  for (const row of readThisYearRows ?? []) {
    readCountByUser.set(row.user_id, (readCountByUser.get(row.user_id) ?? 0) + 1);
  }

  // Check who was notified in the last 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
  const { data: recentNotifs } = await supabase
    .from('notifications')
    .select('user_id')
    .in('user_id', userIds)
    .eq('type', 'reading_pace')
    .gte('created_at', sevenDaysAgo);

  const recentlyNotified = new Set((recentNotifs ?? []).map((n) => n.user_id));

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Reading pace agent: missing ANTHROPIC_API_KEY');
    return NextResponse.json({ error: 'Missing ANTHROPIC_API_KEY' }, { status: 500 });
  }

  let notified = 0;

  for (const profile of profiles) {
    const userId = profile.id;
    const readingGoal = profile.reading_goal as number;

    if (recentlyNotified.has(userId)) continue;

    // Must have at least one currently reading book
    const readingBooks = readingByUser.get(userId) ?? [];
    if (readingBooks.length === 0) continue;

    // Compare books read so far vs expected pace
    const booksReadThisYear = readCountByUser.get(userId) ?? 0;
    const expectedByNow = readingGoal * (daysIntoYear / 365);
    const booksShort = expectedByNow - booksReadThisYear;

    if (booksShort < 1) continue; // On pace, skip

    // Build Claude prompt
    const currentTitle = readingBooks[0].book?.title ?? 'their current book';
    const prompt = `A reader's goal is ${readingGoal} books this year. They've finished ${booksReadThisYear} so far and are currently reading "${currentTitle}". They're a bit behind their goal pace.

Write a warm, friendly 2-sentence nudge encouraging them to read a bit more. Sound like a supportive friend, not a productivity app. Don't mention specific numbers.

Return only the message text.`;

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!claudeRes.ok) {
      console.error('Reading pace agent: Claude error', claudeRes.status);
      continue;
    }

    const claudeData = await claudeRes.json();
    const message = claudeData.content?.[0]?.text?.trim();
    if (!message) continue;

    const { error } = await supabase.from('notifications').insert({
      user_id: userId,
      type:    'reading_pace',
      message,
    });

    if (error) {
      console.error('Reading pace agent: insert failed', error.message);
      continue;
    }

    notified++;
    console.log(`Reading pace agent: notified user ${userId} (${booksReadThisYear}/${readingGoal} books)`);
  }

  return NextResponse.json({ ok: true, processed: profiles.length, notified });
}
