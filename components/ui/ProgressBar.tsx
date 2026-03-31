interface ProgressBarProps {
  value: number; // 0–100
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, showLabel = false, className = '' }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={className}>
      <div className="h-1.5 bg-surface-hover rounded-full overflow-hidden border border-subtle">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clamped}%`, backgroundColor: 'var(--link)' }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-muted mt-1">{clamped}% complete</p>
      )}
    </div>
  );
}
