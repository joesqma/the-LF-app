import { AnalysisClient } from "~/components/analysis/AnalysisClient";
import { PageShell } from "~/components/layout/PageShell";

export default function AnalysisPage() {
  return (
    <PageShell
      title="AI video analysis"
      subtitle="Upload a solve video — get phase-by-phase coaching feedback."
    >
      <AnalysisClient />
    </PageShell>
  );
}
