import Link from "next/link";

interface TrackCardProps {
  href: string;
  name: string;
  description: string;
  icon: string;
  lessonCount: number;
  completedCount: number;
}

export function TrackCard({
  href,
  name,
  description,
  icon,
  lessonCount,
  completedCount,
}: TrackCardProps) {
  const pct =
    lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors hover:border-foreground/30 hover:bg-accent/40"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-base font-semibold text-foreground">{name}</span>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {completedCount} / {lessonCount} lessons
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
