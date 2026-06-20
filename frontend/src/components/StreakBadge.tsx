interface Props {
  streak: number;
  small?: boolean;
}

export function StreakBadge({ streak, small }: Props) {
  if (streak === 0) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full bg-orange-50 text-orange-600 ${
        small ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2.5 py-1'
      }`}
    >
      🔥 {streak}
    </span>
  );
}
