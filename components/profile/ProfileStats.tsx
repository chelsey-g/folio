interface ProfileStatsProps {
  booksRead: number;
  booksReading: number;
  wantToRead: number;
  avgRating?: number | null;
}

export function ProfileStats({ booksRead, booksReading, wantToRead, avgRating }: ProfileStatsProps) {
  const stats = [
    { value: booksRead,              label: 'Read'         },
    { value: booksReading,           label: 'Reading'      },
    { value: wantToRead,             label: 'Want to read' },
    { value: avgRating?.toFixed(1) ?? '—', label: 'Avg rating', suffix: avgRating ? ' ★' : '' },
  ];

  return (
    <div className="grid grid-cols-4 divide-x divide-[var(--border)]">
      {stats.map(({ value, label, suffix = '' }) => (
        <div key={label} className="text-center px-3 first:pl-0 last:pr-0">
          <p className="text-2xl font-bold text-primary tabular-nums leading-none">
            {value}<span className="text-base text-[var(--link)]">{suffix}</span>
          </p>
          <p className="text-xs text-muted mt-1.5 leading-none">{label}</p>
        </div>
      ))}
    </div>
  );
}
