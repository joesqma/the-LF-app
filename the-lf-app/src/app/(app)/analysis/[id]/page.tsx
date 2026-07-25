import { redirect } from "next/navigation";
import { AnalysisResultClient } from "~/components/analysis/AnalysisResultClient";
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

  const analysisResult = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysisResult.data) redirect("/analysis");

  const analysis = analysisResult.data;

  const { data: signedData } = analysis.video_path
    ? await supabase.storage
        .from("solve-videos")
        .createSignedUrl(analysis.video_path, 3600)
    : { data: null };

  return (
    <div style={{ background: "var(--bg)", padding: "28px 32px 48px" }}>
      <AnalysisResultClient
        analysis={analysis}
        videoUrl={signedData?.signedUrl ?? null}
      />
    </div>
  );
}
