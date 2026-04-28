interface Props {
  summary: string;
  estimatedTime: string;
  topPriorities: string[];
}

export function AnalysisSummaryCard({
  summary,
  estimatedTime,
  topPriorities,
}: Props) {
  return (
    <div className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Summary
          </p>
          <span className="font-mono text-xs text-muted-foreground">
            {estimatedTime}s
          </span>
        </div>
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Top priorities
        </p>
        <div className="flex flex-col gap-2">
          {topPriorities.map((priority, i) => (
            <div
              key={priority}
              className="flex items-start gap-3 rounded-lg bg-accent/50 px-3 py-2.5"
            >
              <span className="mt-px font-mono text-xs font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <p className="text-sm text-foreground">{priority}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
