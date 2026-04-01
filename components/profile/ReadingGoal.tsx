'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface ReadingGoalProps {
  goal: number | null;
  readThisYear: number;
  year: number;
}

export function ReadingGoal({ goal: initialGoal, readThisYear, year }: ReadingGoalProps) {
  const [goal,    setGoal]    = useState(initialGoal);
  const [editing, setEditing] = useState(false);
  const [input,   setInput]   = useState(String(initialGoal ?? ''));
  const [saving,  setSaving]  = useState(false);

  const percent   = goal && goal > 0 ? Math.min(100, Math.round((readThisYear / goal) * 100)) : 0;
  const remaining = goal ? Math.max(0, goal - readThisYear) : 0;

  // SVG ring
  const r    = 34;
  const size = 88;
  const cx   = size / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - percent / 100);

  async function saveGoal() {
    const val = parseInt(input);
    if (!val || val < 1 || val > 9999) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('profiles').update({ reading_goal: val }).eq('id', user.id);
      if (!error) setGoal(val);
    }
    setSaving(false);
    setEditing(false);
  }

  // No goal set
  if (!goal && !editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="w-full flex items-center justify-between px-5 py-4 bg-surface border border-subtle rounded-2xl shadow-sm shadow-black/5 hover:border-default transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center text-base">
            🎯
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-primary">Set a {year} reading goal</p>
            <p className="text-xs text-muted">How many books do you want to read this year?</p>
          </div>
        </div>
        <span className="text-muted text-sm group-hover:text-primary transition-colors">+</span>
      </button>
    );
  }

  // Inline goal setter
  if (editing) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 bg-surface border border-default rounded-2xl shadow-sm shadow-black/5">
        <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center text-base shrink-0">
          🎯
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted mb-1.5">{year} reading goal</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
              placeholder="52"
              min={1}
              max={9999}
              autoFocus
              className="w-20 px-2.5 py-1.5 bg-input border border-input rounded-lg text-sm text-primary text-center focus:outline-none focus:ring-2 focus:ring-[var(--link)] focus:border-transparent"
            />
            <span className="text-sm text-muted">books</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(false)}
            className="text-xs text-muted hover:text-primary transition-colors px-2 py-1"
          >
            Cancel
          </button>
          <button
            onClick={saveGoal}
            disabled={saving}
            className="text-xs font-semibold bg-btn text-btn-fg px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  // Goal set — show ring
  return (
    <div className="flex items-center gap-5 px-5 py-4 bg-surface border border-subtle rounded-2xl shadow-sm shadow-black/5">
      {/* SVG ring */}
      <div className="shrink-0 relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          {/* Track */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={6}
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cx} r={r}
            fill="none"
            stroke="var(--link)"
            strokeWidth={6}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)' }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-primary leading-none tabular-nums">{percent}</span>
          <span className="text-[9px] text-muted leading-none mt-0.5">%</span>
        </div>
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-muted uppercase tracking-widest mb-1">{year} Goal</p>
        <p className="text-2xl font-bold text-primary tabular-nums leading-none">
          {readThisYear}
          <span className="text-base font-normal text-muted"> / {goal}</span>
        </p>
        <p className="text-xs text-muted mt-1.5">
          {percent >= 100
            ? '🎉 Goal complete!'
            : `${remaining} book${remaining !== 1 ? 's' : ''} to go`}
        </p>
      </div>

      {/* Edit + stats link */}
      <div className="flex flex-col items-end gap-2 shrink-0">
        <Link
          href="/stats"
          className="text-xs font-medium text-link hover:opacity-80 transition-opacity"
        >
          View stats →
        </Link>
        <button
          onClick={() => { setInput(String(goal)); setEditing(true); }}
          className="text-xs text-muted hover:text-primary transition-colors"
        >
          Edit goal
        </button>
      </div>
    </div>
  );
}
