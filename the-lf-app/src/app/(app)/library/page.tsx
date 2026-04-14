import { PageShell } from "~/components/layout/PageShell";

export default function LibraryPage() {
  return (
    <PageShell title="Library" subtitle="Your saved videos and resources.">
      <p className="text-sm text-muted-foreground">
        Bookmarked content will appear here.
      </p>
    </PageShell>
  );
}
