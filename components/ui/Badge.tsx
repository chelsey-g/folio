import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'amber' | 'green' | 'blue' | 'ember';
  className?: string;
}

const variants = {
  default: 'bg-stone-100 text-stone-600 border border-stone-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  green: 'bg-green-50 text-green-700 border border-green-200',
  blue: 'bg-blue-50 text-blue-700 border border-blue-200',
  ember: 'bg-ember-50 text-ember-700 border border-ember-100',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
