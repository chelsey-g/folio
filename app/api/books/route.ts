import { NextResponse } from 'next/server';
import type { GoogleBooksResponse } from '@/types';
import { isCollectionOrSet } from '@/lib/utils';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const id = searchParams.get('id');

  if (id) {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes/${id}`);
    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const data = await res.json();
    return NextResponse.json(data);
  }

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q);
  url.searchParams.set('maxResults', '20');
  url.searchParams.set('printType', 'books');

  const res = await fetch(url.toString());
  if (!res.ok) return NextResponse.json({ error: 'Google Books API error' }, { status: 502 });

  const data: GoogleBooksResponse = await res.json();
  const filtered = (data.items ?? []).filter((v) => !isCollectionOrSet(v));
  return NextResponse.json({ ...data, items: filtered });
}
