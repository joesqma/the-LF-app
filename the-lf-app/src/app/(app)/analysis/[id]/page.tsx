import { redirect } from "next/navigation";
import { AnalysisResultClient } from "~/components/analysis/AnalysisResultClient";
import { PageShell } from "~/components/layout/PageShell";
import { createClient } from "~/lib/supabase/server";

export default async function AnalysisResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [analysisResult, chatResult, profileResult] = await Promise.all([
    supabase
      .from("analyses")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("analysis_chats")
      .select("id, role, content")
      .eq("analysis_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("user_profiles").select("tier").eq("id", user.id).single(),
  ]);

  if (!analysisResult.data) redirect("/analysis");

  const analysis = analysisResult.data;
  const initialMessages = (chatResult.data ?? []).map((m) => ({
    id: m.id as string,
    role: m.role as "user" | "assistant",
    content: m.content as string,
  }));
  const userTier =
    (profileResult.data?.tier as string | null as
      | "free"
      | "premium"
      | "lifetime"
      | null) ?? "free";

  const { data: signedData } = analysis.video_path
    ? await supabase.storage
        .from("solve-videos")
        .createSignedUrl(analysis.video_path, 3600)
    : { data: null };

  return (
    <PageShell title="Solve Analysis">
      <AnalysisResultClient
        analysis={analysis}
        videoUrl={signedData?.signedUrl ?? null}
        initialMessages={initialMessages}
        userTier={userTier}
      />
    </PageShell>
  );
}
