import { PageShell } from "~/components/layout/PageShell";
import { SettingsClient } from "~/components/settings/SettingsClient";

export default function SettingsPage() {
  return (
    <PageShell title="Settings">
      <SettingsClient />
    </PageShell>
  );
}
