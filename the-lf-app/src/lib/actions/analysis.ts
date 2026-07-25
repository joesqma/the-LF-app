"use server";

import { createClient } from "~/lib/supabase/server";

export async function createAnalysis(
  userId: string,
  videoPath: string,
  method: "cfop" | "beginner",
  scramble?: string,
): Promise<{ error: string } | { id: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      video_path: videoPath,
      method,
      scramble: scramble?.trim() || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { id: data.id };
}

export async function getAnalysis(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function getAnalysisHistory(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteAnalysis(
  id: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { error: "Unauthorized" };

  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("id, video_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (analysisError) {
    return { error: `Failed to find analysis: ${analysisError.message}` };
  }
  if (!analysis) return { error: "Analysis not found" };

  // Remove the large object before its database reference is lost.
  if (analysis.video_path) {
    const { error: storageError } = await supabase.storage
      .from("solve-videos")
      .remove([analysis.video_path]);

    if (storageError) {
      return { error: `Failed to delete video: ${storageError.message}` };
    }
  }

  const { error: deleteError } = await supabase
    .from("analyses")
    .delete()
    .eq("id", analysis.id)
    .eq("user_id", user.id);

  if (deleteError) {
    return { error: `Failed to delete analysis: ${deleteError.message}` };
  }

  return { success: true };
}
