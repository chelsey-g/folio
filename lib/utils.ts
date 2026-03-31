import type { GoogleBooksVolume, Book } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function googleVolumeToBook(volume: GoogleBooksVolume): Book {
  const { id, volumeInfo } = volume;
  const isbn13 = volumeInfo.industryIdentifiers?.find(
    (i) => i.type === 'ISBN_13'
  )?.identifier ?? null;

  // Use https for cover images
  const coverUrl = volumeInfo.imageLinks?.thumbnail
    ? volumeInfo.imageLinks.thumbnail.replace('http://', 'https://')
    : null;

  return {
    id,
    title: volumeInfo.title,
    authors: volumeInfo.authors ?? null,
    description: volumeInfo.description ?? null,
    cover_url: coverUrl,
    isbn_13: isbn13,
    page_count: volumeInfo.pageCount ?? null,
    published_date: volumeInfo.publishedDate ?? null,
    categories: volumeInfo.categories ?? null,
    created_at: new Date().toISOString(),
  };
}

export function formatAuthors(authors: string[] | null): string {
  if (!authors || authors.length === 0) return 'Unknown Author';
  if (authors.length === 1) return authors[0];
  if (authors.length === 2) return authors.join(' & ');
  return `${authors[0]} & ${authors.length - 1} others`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}
