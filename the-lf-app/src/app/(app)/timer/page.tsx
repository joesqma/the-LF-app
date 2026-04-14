import { PageShell } from "~/components/layout/PageShell";

export default function TimerPage() {
  return (
    <PageShell title="Timer" subtitle="Track and log your solves.">
      <p className="text-sm text-muted-foreground">
        The solve timer will appear here.
      </p>
    </PageShell>
  );
}
