import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'amber' | 'green' | 'blue';
  className?: string;
}

const variants = {
  default: 'bg-[var(--surface-hover)] text-[var(--text-2)] border-[var(--border)]',
  amber:   'bg-amber-500/10 text-amber-500 border-amber-500/20',
  green:   'bg-green-500/10 text-green-500 border-green-500/20',
  blue:    'bg-[var(--accent-bg)] text-[var(--link)] border-[var(--accent-border)]',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
