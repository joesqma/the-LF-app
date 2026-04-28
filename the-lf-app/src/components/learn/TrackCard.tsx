import Link from "next/link";
import { cn } from "~/lib/utils";

interface TrackCardProps {
  href?: string;
  name: string;
  description: string;
  icon: string;
  lessonCount?: number;
  completedCount?: number;
  recommendationBadge?: string;
  comingSoon?: boolean;
}

export function TrackCard({
  href,
  name,
  description,
  icon,
  lessonCount = 0,
  completedCount = 0,
  recommendationBadge,
  comingSoon,
}: TrackCardProps) {
  const pct =
    lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;

  const inner = (
    <div
      className={cn(
        "flex h-full flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition-colors",
        comingSoon
          ? "opacity-60"
          : "hover:border-foreground/30 hover:bg-accent/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <span className="text-base font-semibold text-foreground">
            {name}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {recommendationBadge && (
            <span className="rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium text-background">
              AI: {recommendationBadge}
            </span>
          )}
          {comingSoon && (
            <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              Coming Soon
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
      {!comingSoon && (
        <div className="mt-auto flex flex-col gap-1.5">
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
      )}
    </div>
  );

  if (comingSoon || !href) {
    return <div className="cursor-default">{inner}</div>;
  }

  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}
