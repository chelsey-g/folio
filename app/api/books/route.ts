import { NextResponse } from 'next/server';
import { olSearchDocToBook, olWorkToBook } from '@/lib/utils';
import type { OLSearchResponse, OLWork, Book } from '@/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const id = searchParams.get('id');

  if (id) {
    const res = await fetch(`https://openlibrary.org/works/${id}.json`);
    if (!res.ok) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const work: OLWork = await res.json();

    // Fetch up to 3 author names in parallel
    const authorKeys = (work.authors ?? []).slice(0, 3).map((a) => a.author.key);
    const authorNames = await Promise.all(
      authorKeys.map(async (key) => {
        try {
          const r = await fetch(`https://openlibrary.org${key}.json`);
          const data = await r.json();
          return typeof data.name === 'string' ? data.name : null;
        } catch {
          return null;
        }
      })
    ).then((names) => names.filter((n): n is string => n !== null));

    const book: Book = olWorkToBook(work, authorNames);
    return NextResponse.json(book);
  }

  if (!q) {
    return NextResponse.json({ error: 'Missing query' }, { status: 400 });
  }

  const url = new URL('https://openlibrary.org/search.json');
  url.searchParams.set('q', q);
  url.searchParams.set('fields', 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn');
  url.searchParams.set('limit', '20');

  const res = await fetch(url.toString());
  if (!res.ok) return NextResponse.json({ error: 'Open Library API error' }, { status: 502 });

  const data: OLSearchResponse = await res.json();
  const items = (data.docs ?? []).map(olSearchDocToBook);
  return NextResponse.json({ items });
}
