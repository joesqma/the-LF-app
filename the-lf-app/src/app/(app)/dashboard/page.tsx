import { PageShell } from "~/components/layout/PageShell";

export default function DashboardPage() {
  return (
    <PageShell title="Dashboard" subtitle="Welcome back to Cubewise.">
      <p className="text-sm text-muted-foreground">
        Your personalised coaching overview will appear here.
      </p>
    </PageShell>
  );
}
