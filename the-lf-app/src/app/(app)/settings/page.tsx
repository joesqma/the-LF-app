import { redirect } from "next/navigation";
import { PageShell } from "~/components/layout/PageShell";
import { SettingsClient } from "~/components/settings/SettingsClient";
import { createClient } from "~/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("wca_id")
    .eq("id", user.id)
    .single();

  return (
    <PageShell title="Settings">
      <SettingsClient
        email={user.email ?? null}
        wcaId={profile?.wca_id ?? null}
      />
    </PageShell>
  );
}
