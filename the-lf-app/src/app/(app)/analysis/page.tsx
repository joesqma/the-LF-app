import { PageShell } from "~/components/layout/PageShell";

export default function AnalysisPage() {
  return (
    <PageShell
      title="Analysis"
      subtitle="Upload a solve video for AI feedback."
    >
      <p className="text-sm text-muted-foreground">
        Video analysis will appear here.
      </p>
    </PageShell>
  );
}
