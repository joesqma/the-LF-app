"use server";

import { createClient } from "~/lib/supabase/server";

export async function createAnalysis(
  userId: string,
  videoPath: string,
  method: "cfop" | "roux",
): Promise<{ error: string } | { id: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      video_path: videoPath,
      method,
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
