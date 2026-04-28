import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { createClient } from "~/lib/supabase/server";
import type { Analysis } from "~/types/database";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusDot({ status }: { status: Analysis["status"] }) {
  if (status === "complete") {
    return <div className="h-2 w-2 rounded-full bg-emerald-500" />;
  }
  if (status === "failed") {
    return <div className="h-2 w-2 rounded-full bg-destructive" />;
  }
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

export default async function AnalysisHistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, method, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <PageShell
      title="Analysis History"
      subtitle="All your solve analyses, newest first."
    >
      <div className="flex flex-col gap-4">
        <Link
          href="/analysis"
          className="self-start text-xs text-muted-foreground hover:text-foreground"
        >
          ← New analysis
        </Link>

        {!analyses || analyses.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No analyses yet. Upload a solve video to get started.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <StatusDot status={analysis.status} />
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {analysis.method?.toUpperCase() ?? "CFOP"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {STATUS_LABEL[analysis.status]}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(analysis.created_at)}
                    </span>
                  </div>
                </div>
                <Link
                  href={`/analysis/${analysis.id}`}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {ACTION_LABEL[analysis.status]}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
