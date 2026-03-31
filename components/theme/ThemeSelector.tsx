'use client';

import { useState, useRef, useEffect } from 'react';
import { useTheme, type Theme } from './ThemeProvider';

const THEMES: { id: Theme; name: string; bg: string; accent: string }[] = [
  { id: 'parchment', name: 'Parchment', bg: '#F7F3EC', accent: '#CB6B1A' },
  { id: 'midnight', name: 'Midnight',  bg: '#0F0F18', accent: '#7C72F5' },
  { id: 'forest',   name: 'Forest',    bg: '#0B1A0E', accent: '#22C55E' },
  { id: 'rose',     name: 'Rose',      bg: '#FDF4F6', accent: '#E11D48' },
];

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Change theme"
        title="Change theme"
        className="w-7 h-7 rounded-full border-2 border-[var(--border-strong)] hover:scale-110 transition-transform shadow-sm"
        style={{ background: `linear-gradient(135deg, ${current.bg} 50%, ${current.accent} 50%)` }}
      />

      {open && (
        <div
          className="absolute right-0 top-10 z-50 bg-surface border border-subtle rounded-2xl shadow-2xl shadow-black/20 p-3 w-44"
          style={{ backdropFilter: 'blur(12px)' }}
        >
          <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-2 mb-2">
            Theme
          </p>
          <div className="space-y-0.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-surface-hover transition-colors text-left"
              >
                <div
                  className="w-6 h-6 rounded-full border border-subtle shrink-0 shadow-sm"
                  style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)` }}
                />
                <span className="text-sm font-medium text-primary">{t.name}</span>
                {theme === t.id && (
                  <span className="ml-auto text-xs text-link font-bold">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
