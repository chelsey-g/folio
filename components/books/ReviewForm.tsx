'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StarRating } from '@/components/ui/StarRating';
import type { UserBook } from '@/types';

interface ReviewFormProps {
  userBook: UserBook;
  onUpdate?: (userBook: UserBook) => void;
}

export function ReviewForm({ userBook, onUpdate }: ReviewFormProps) {
  const [rating, setRating] = useState<number | null>(userBook.rating);
  const [review, setReview] = useState(userBook.review ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_books')
      .update({ rating, review: review.trim() || null })
      .eq('id', userBook.id)
      .select().single();

    if (!error && data) {
      onUpdate?.(data as UserBook);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
    setSaving(false);
  }

  return (
    <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-5">
      <div>
        <p className="text-sm font-semibold text-primary mb-3">Your rating</p>
        <StarRating value={rating} onChange={setRating} size="lg" />
        {rating && (
          <p className="text-xs text-muted mt-1.5">
            {['', 'Did not like it', 'It was ok', 'Liked it', 'Really liked it', 'It was amazing'][rating]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="review" className="text-sm font-semibold text-primary block mb-2">
          Your review
        </label>
        <textarea
          id="review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={5}
          className="w-full px-3.5 py-3 bg-input border border-input rounded-xl text-sm text-primary leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent resize-none placeholder:text-muted"
          placeholder="What did you think? Any memorable moments or quotes?"
        />
        <p className="text-xs text-muted mt-1 text-right">{review.length} chars</p>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2.5 bg-btn text-btn-fg rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md shadow-black/10"
      >
        {saving ? 'Saving…' : saved ? '✓ Review saved' : 'Save review'}
      </button>
    </div>
  );
}
