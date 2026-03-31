import { createClient } from '@/lib/supabase/server';
import { ShelfView } from '@/components/books/ShelfView';
import Link from 'next/link';
import type { UserBook } from '@/types';

export default async function ShelfPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('user_books').select('*, book:books(*)')
    .eq('user_id', user.id).order('updated_at', { ascending: false });

  const userBooks = (data ?? []) as UserBook[];
  const total     = userBooks.length;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-serif text-3xl font-bold text-primary">My Shelf</h1>
          <p className="text-sm text-muted mt-1">
            {total} book{total !== 1 ? 's' : ''} in your collection
          </p>
        </div>
        <Link
          href="/search"
          className="text-sm font-medium text-secondary hover:text-link border border-subtle hover:border-default bg-surface px-3.5 py-2 rounded-xl transition-all"
        >
          + Add books
        </Link>
      </div>

      {total === 0 ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
            📚
          </div>
          <h2 className="font-serif text-xl font-semibold text-primary mb-2">Your shelf is empty</h2>
          <p className="text-sm text-muted mb-6">Start building your collection by discovering books.</p>
          <Link
            href="/search"
            className="inline-block bg-btn text-btn-fg px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Discover books
          </Link>
        </div>
      ) : (
        <ShelfView userBooks={userBooks} />
      )}
    </div>
  );
}
