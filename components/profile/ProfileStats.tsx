interface StatCardProps {
  value: number | string;
  label: string;
  icon: string;
  colorClass: string;
}

function StatCard({ value, label, icon, colorClass }: StatCardProps) {
  return (
    <div className="bg-surface border border-subtle rounded-2xl p-4 text-center shadow-sm shadow-black/5">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base mx-auto mb-2 ${colorClass}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-primary leading-none">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

interface ProfileStatsProps {
  booksRead: number;
  booksReading: number;
  wantToRead: number;
  avgRating?: number | null;
}

export function ProfileStats({ booksRead, booksReading, wantToRead, avgRating }: ProfileStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard value={booksRead}   label="Read"         icon="✓" colorClass="bg-green-500/10 text-green-500" />
      <StatCard value={booksReading} label="Reading"     icon="→" colorClass="bg-[var(--accent-bg)] text-[var(--link)]" />
      <StatCard value={wantToRead}  label="Want to Read" icon="○" colorClass="bg-blue-500/10 text-blue-400" />
      <StatCard
        value={avgRating ? `${avgRating.toFixed(1)}★` : '—'}
        label="Avg Rating"
        icon="★"
        colorClass="bg-amber-500/10 text-amber-400"
      />
    </div>
  );
}
