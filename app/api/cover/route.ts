import { NextResponse } from 'next/server';
import { fetchLongitoodCover } from '@/lib/bookcover';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title  = searchParams.get('title');
  const author = searchParams.get('author');
  const isbn   = searchParams.get('isbn');

  if (!title) return NextResponse.json({ url: null }, { status: 400 });

  const url = await fetchLongitoodCover(title, author, isbn);
  return NextResponse.json({ url });
}
