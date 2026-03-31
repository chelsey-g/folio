'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { UserBook } from '@/types';

interface ProgressTrackerProps {
  userBook: UserBook;
  pageCount: number | null;
  onUpdate?: (updated: UserBook) => void;
}

export function ProgressTracker({ userBook, pageCount, onUpdate }: ProgressTrackerProps) {
  const [currentPage, setCurrentPage] = useState(userBook.current_page ?? 0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const progress =
    pageCount && pageCount > 0
      ? Math.min(100, Math.round((currentPage / pageCount) * 100))
      : 0;

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('user_books')
      .update({ current_page: currentPage })
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
    <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-primary">Reading progress</p>
        {pageCount && (
          <span className="text-xs font-medium text-link bg-accent-soft border border-accent-soft px-2 py-0.5 rounded-full">
            {progress}%
          </span>
        )}
      </div>

      <ProgressBar value={progress} />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <input
            type="number"
            value={currentPage}
            onChange={(e) =>
              setCurrentPage(Math.max(0, Math.min(pageCount ?? 99999, parseInt(e.target.value) || 0)))
            }
            onKeyDown={(e) => e.key === 'Enter' && save()}
            min={0}
            max={pageCount ?? undefined}
            className="w-20 px-2.5 py-1.5 bg-input border border-input rounded-lg text-sm text-primary text-center focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent"
          />
          <span className="text-sm text-muted">
            {pageCount ? `of ${pageCount} pages` : 'pages read'}
          </span>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="text-sm font-medium bg-btn text-btn-fg px-4 py-1.5 rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Update'}
        </button>
      </div>
    </div>
  );
}
