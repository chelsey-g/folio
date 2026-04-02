import Image from 'next/image';
import { cn } from '@/lib/utils';

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  width?: number;
  height?: number;
  className?: string;
}

// Each cover gets a deterministic warm gradient based on title
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

export function BookCover({ coverUrl, title, width = 80, height = 120, className = '' }: BookCoverProps) {
  const gradient = getGradient(title);

  if (!coverUrl) {
    return (
      <div
        className={cn(
          `bg-gradient-to-b ${gradient} flex flex-col items-center justify-center rounded-sm text-white/90 text-xs font-serif font-medium text-center p-2 select-none`,
          className
        )}
        style={{ width, height }}
      >
        <span className="text-white/60 text-[10px] uppercase tracking-wider mb-1">Book</span>
        <span className="line-clamp-3 leading-tight text-[11px]">{title.slice(0, 30)}</span>
      </div>
    );
  }

  return (
    <Image
      src={coverUrl}
      alt={`Cover of ${title}`}
      width={width}
      height={height}
      style={{ width: `${width}px` }}
      className={cn('rounded-sm object-cover', className)}
    />
  );
}
