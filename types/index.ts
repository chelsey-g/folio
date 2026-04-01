export type ShelfType = 'want_to_read' | 'reading' | 'read';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  reading_goal: number | null;
  created_at: string;
}

export interface Book {
  id: string; // Open Library work ID (e.g. "OL45804W")
  title: string;
  authors: string[] | null;
  description: string | null;
  cover_url: string | null;
  isbn_13: string | null;
  page_count: number | null;
  published_date: string | null;
  categories: string[] | null;
  created_at: string;
}

export interface UserBook {
  id: string;
  user_id: string;
  book_id: string;
  shelf: ShelfType;
  rating: number | null;
  review: string | null;
  current_page: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  book?: Book;
}

// Open Library API response types
export interface OLSearchDoc {
  key: string; // "/works/OL45804W"
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
  isbn?: string[];
}

export interface OLSearchResponse {
  numFound: number;
  docs: OLSearchDoc[];
}

export interface OLWork {
  key: string;
  title: string;
  description?: string | { value: string };
  subjects?: string[];
  covers?: number[];
  authors?: Array<{ author: { key: string } }>;
}

// Shelf label map
export const SHELF_LABELS: Record<ShelfType, string> = {
  want_to_read: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
};
