'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookCover } from './BookCover';
import type { Book } from '@/types';

interface Props {
  bookId: string;
  title: string;
  authors: string[] | null;
  categories: string[] | null;
  description: string | null;
}

export function SimilarBooks({ bookId, title, authors, categories, description }: Props) {
  const [books, setBooks] = useState<Book[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams({ id: bookId, title });
    if (description) params.set('description', description.slice(0, 600));
    (authors ?? []).forEach((a) => params.append('authors', a));
    (categories ?? []).forEach((c) => params.append('categories', c));

    fetch(`/api/similar?${params}`)
      .then((r) => r.ok ? r.json() : { items: [] })
      .then((d) => {
        setBooks(d.items ?? []);
        setReady(true);
      })
      .catch(() => setReady(true));
  }, [bookId, title, authors, categories, description]);

  if (!ready || books.length === 0) return null;

  return (
    <section className="mt-10 animate-in">
      <h2 className="font-serif text-sm font-semibold text-muted uppercase tracking-widest mb-4">
        More like this
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none">
        {books.map((book) => (
          <Link
            key={book.id}
            href={`/books/${book.id}`}
            className="flex-shrink-0 w-[68px] group"
          >
            <div className="shadow-md shadow-black/15 rounded-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-200">
              <BookCover
                coverUrl={book.cover_url}
                title={book.title}
                author={book.authors?.[0]}
                isbn={book.isbn_13}
                width={68}
                height={102}
                className="w-full"
              />
            </div>
            <p className="text-[11px] text-primary font-medium line-clamp-2 leading-snug mt-2 group-hover:text-link transition-colors">
              {book.title}
            </p>
            <p className="text-[10px] text-muted line-clamp-1 mt-0.5">
              {book.authors?.[0] ?? ''}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
