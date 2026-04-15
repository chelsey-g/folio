'use client';

import Image from 'next/image';
import { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  author?: string | null;
  isbn?: string | null;
  width?: number;
  height?: number;
  className?: string;
}

const COVER_GRADIENTS = [
  'from-amber-900 to-amber-700',
  'from-stone-800 to-stone-600',
  'from-emerald-900 to-emerald-700',
  'from-sky-900 to-sky-700',
  'from-rose-900 to-rose-700',
  'from-indigo-900 to-indigo-700',
  'from-teal-900 to-teal-700',
  'from-orange-900 to-orange-700',
];

function getGradient(title: string) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COVER_GRADIENTS[Math.abs(hash) % COVER_GRADIENTS.length];
}

function Placeholder({ title, width, height, className }: { title: string; width: number; height: number; className: string }) {
  return (
    <div
      className={cn(
        `bg-gradient-to-b ${getGradient(title)} flex flex-col items-center justify-center rounded-sm text-white/90 text-xs font-serif font-medium text-center p-2 select-none`,
        className
      )}
      style={{ width, height }}
    >
      <span className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Book</span>
      <span className="line-clamp-3 leading-tight text-[11px]">{title.slice(0, 30)}</span>
    </div>
  );
}

export function BookCover({ coverUrl, title, author, isbn, width = 80, height = 120, className = '' }: BookCoverProps) {
  const [src, setSrc] = useState<string | null>(coverUrl);
  // useRef so the flag is always current inside the async onError handler
  const triedLongitood = useRef(false);

  async function handleError() {
    if (triedLongitood.current) {
      setSrc(null);
      return;
    }
    triedLongitood.current = true;

    try {
      const params = new URLSearchParams({ title });
      if (author) params.set('author', author);
      if (isbn)   params.set('isbn', isbn);
      const res = await fetch(`/api/cover?${params}`);
      const data: { url: string | null } = await res.json();
      if (data.url) {
        setSrc(data.url);
        return;
      }
    } catch { /* fall through */ }

    setSrc(null);
  }

  if (!src) {
    return <Placeholder title={title} width={width} height={height} className={className} />;
  }

  return (
    <Image
      src={src}
      alt={`Cover of ${title}`}
      width={width}
      height={height}
      style={{ height: 'auto' }}
      className={cn('rounded-sm', className)}
      onError={handleError}
      unoptimized
    />
  );
}
