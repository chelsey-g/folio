import { NextResponse } from 'next/server';
import { olSearchDocToBook, olWorkToBook } from '@/lib/utils';
import { fetchLongitoodCover } from '@/lib/bookcover';
import type { OLSearchResponse, OLWork, Book } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const id = searchParams.get('id');

  if (id) {
    const res = await fetch(`https://openlibrary.org/works/${id}.json`, {
      signal: AbortSignal.timeout(8000),
    }).catch(() => null);
    if (!res?.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const work: OLWork = await res.json();

    // Fetch up to 3 author names in parallel
    const authorKeys = (work.authors ?? []).slice(0, 3).map((a) => a.author.key);
    const authorNames = await Promise.all(
      authorKeys.map(async (key) => {
        try {
          const r = await fetch(`https://openlibrary.org${key}.json`, {
            signal: AbortSignal.timeout(5000),
          });
          const data = await r.json();
          return typeof data.name === 'string' ? data.name : null;
        } catch {
          return null;
        }
      })
    ).then((names) => names.filter((n): n is string => n !== null));

    let book: Book = olWorkToBook(work, authorNames);
    if (!book.cover_url) {
      const coverUrl = await fetchLongitoodCover(
        book.title,
        authorNames[0] ?? null,
        null,
      );
      if (coverUrl) book = { ...book, cover_url: coverUrl };
    }
    return NextResponse.json(book);
  }

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn');
  url.searchParams.set('limit', '20');

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: 'Open Library API error' }, { status: 502 });

  const data: OLSearchResponse = await res.json();
  const raw = (data.docs ?? []).map(olSearchDocToBook);

  // Fill missing covers via longitood (in parallel, best-effort)
  const items: Book[] = await Promise.all(
    raw.map(async (book) => {
      if (book.cover_url) return book;
      const coverUrl = await fetchLongitoodCover(
        book.title,
        book.authors?.[0] ?? null,
        book.isbn_13,
      );
      return coverUrl ? { ...book, cover_url: coverUrl } : book;
    })
  );

  return NextResponse.json({ items });
}
