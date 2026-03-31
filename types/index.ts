export type ShelfType = 'want_to_read' | 'reading' | 'read';

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export interface Book {
  id: string; // Google Books volume ID
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

// Google Books API response types
export interface GoogleBooksVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
    };
    industryIdentifiers?: Array<{
      type: string;
      identifier: string;
    }>;
    pageCount?: number;
    publishedDate?: string;
    categories?: string[];
    publisher?: string;
  };
}

export interface GoogleBooksResponse {
  totalItems: number;
  items?: GoogleBooksVolume[];
}

// Shelf label map
export const SHELF_LABELS: Record<ShelfType, string> = {
  want_to_read: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
};
