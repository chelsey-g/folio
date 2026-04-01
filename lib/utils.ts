import type { OLSearchDoc, OLWork, Book } from '@/types';

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export function olSearchDocToBook(doc: OLSearchDoc): Book {
  return {
    id: doc.key.replace('/works/', ''),
    title: doc.title,
    authors: doc.author_name ?? null,
    description: null,
    cover_url: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : null,
    isbn_13: doc.isbn?.find((i) => i.length === 13) ?? null,
    page_count: doc.number_of_pages_median ?? null,
    published_date: doc.first_publish_year?.toString() ?? null,
    categories: doc.subject?.slice(0, 3) ?? null,
    created_at: new Date().toISOString(),
  };
}

export function olWorkToBook(work: OLWork, authors: string[]): Book {
  const description =
    typeof work.description === 'string'
      ? work.description
      : work.description?.value ?? null;

  return {
    id: work.key.replace('/works/', ''),
    title: work.title,
    authors: authors.length > 0 ? authors : null,
    description,
    cover_url: work.covers?.[0]
      ? `https://covers.openlibrary.org/b/id/${work.covers[0]}-M.jpg`
      : null,
    isbn_13: null,
    page_count: null,
    published_date: null,
    categories: work.subjects?.slice(0, 3) ?? null,
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
