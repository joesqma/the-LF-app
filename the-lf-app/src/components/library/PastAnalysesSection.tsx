import Link from "next/link";
import type { Analysis } from "~/types/database";

function StatusDot({ status }: { status: Analysis["status"] }) {
  if (status === "complete")
    return <div className="h-2 w-2 rounded-full bg-emerald-500" />;
  if (status === "failed")
    return <div className="h-2 w-2 rounded-full bg-destructive" />;
  return <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />;
}

const STATUS_LABEL: Record<Analysis["status"], string> = {
  pending: "Queued",
  processing: "Analysing…",
  complete: "Complete",
  failed: "Failed",
};

const ACTION_LABEL: Record<Analysis["status"], string> = {
  pending: "Resume",
  processing: "View",
  complete: "View report",
  failed: "Retry",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface Props {
  analyses: Pick<Analysis, "id" | "method" | "status" | "created_at">[];
}

export function PastAnalysesSection({ analyses }: Props) {
  if (analyses.length === 0) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-border">
        <p className="text-sm text-muted-foreground">
          No analyses yet.{" "}
          <Link href="/analysis" className="underline hover:text-foreground">
            Upload a solve video
          </Link>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {analyses.map((a) => (
        <div
          key={a.id}
          className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
        >
          <div className="flex items-center gap-3">
            <StatusDot status={a.status} />
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">
                  {a.method?.toUpperCase() ?? "CFOP"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDate(a.created_at)}
              </span>
            </div>
          </div>
          <Link
            href={`/analysis/${a.id}`}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
          >
            {ACTION_LABEL[a.status]}
          </Link>
        </div>
      ))}
    </div>
  );
}
