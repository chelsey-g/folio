import { Suspense } from 'react';
import { SearchClient } from './SearchClient';
import { olSearchDocToBook } from '@/lib/utils';
import { fetchLongitoodCover } from '@/lib/bookcover';
import type { OLSearchResponse, Book } from '@/types';

const CATEGORIES = [
  { label: 'Fiction',          query: 'fiction',     emoji: '📖' },
  { label: 'Fantasy & Sci-Fi', query: 'fantasy',     emoji: '🪄' },
  { label: 'Science',          query: 'science',     emoji: '🔬' },
  { label: 'History',          query: 'history',     emoji: '🏛️' },
  { label: 'Biography',        query: 'biography',   emoji: '✍️' },
];

const TARGET = 10; // books to show per category

async function fetchCategory(query: string): Promise<Book[]> {
  try {
    const cutoff = new Date().getFullYear() - 5;
    const url = new URL('https://openlibrary.org/search.json');
    url.searchParams.set('q', `${query} first_publish_year:[${cutoff} TO 9999]`);
    url.searchParams.set('fields', 'key,title,author_name,cover_i,first_publish_year,number_of_pages_median,subject,isbn');
    url.searchParams.set('sort', 'new');
    url.searchParams.set('limit', '50'); // fetch more so we have enough after filtering

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const data: OLSearchResponse = await res.json();
    const docs = data.docs ?? [];

    // Books with an OL cover are guaranteed — show those first
    const hasCover    = docs.filter((d) => d.cover_i).slice(0, TARGET).map(olSearchDocToBook);
    const needsCover  = docs.filter((d) => !d.cover_i);

    // If OL already gave us TARGET books with covers, we're done
    if (hasCover.length >= TARGET) return hasCover;

    // Otherwise fill remaining slots via longitood
    const slots = TARGET - hasCover.length;
    const candidates = needsCover.slice(0, slots * 3).map(olSearchDocToBook); // extra candidates in case some longitood calls fail

    const supplemental: Book[] = [];
    for (const book of candidates) {
      if (supplemental.length >= slots) break;
      const coverUrl = await fetchLongitoodCover(
        book.title,
        book.authors?.[0] ?? null,
        book.isbn_13,
      );
      if (coverUrl) supplemental.push({ ...book, cover_url: coverUrl });
    }

    return [...hasCover, ...supplemental];
  } catch {
    return [];
  }
}

export default async function SearchPage() {
  const categories = await Promise.all(
    CATEGORIES.map(async (cat) => ({
      ...cat,
      books: await fetchCategory(cat.query),
    }))
  );

  return (
    <Suspense>
      <SearchClient
        initialCategories={categories.filter((c) => c.books.length > 0)}
      />
    </Suspense>
  );
}
