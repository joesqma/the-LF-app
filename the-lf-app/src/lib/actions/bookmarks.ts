"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";

interface SaveBookmarkParams {
  videoUrl: string;
  title: string;
  source: string;
  topicTag?: string | null;
  methodTag?: string | null;
}

export async function saveBookmark(
  params: SaveBookmarkParams,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: existing } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("video_url", params.videoUrl)
    .maybeSingle();

  if (existing) return { success: true };

  const { error } = await supabase.from("bookmarks").insert({
    user_id: user.id,
    video_url: params.videoUrl,
    title: params.title,
    source: params.source,
    topic_tag: params.topicTag ?? null,
    method_tag: params.methodTag ?? null,
  });

  if (error) return { error: error.message };

  revalidatePath("/library");
  return { success: true };
}

export async function removeBookmark(
  videoUrl: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("video_url", videoUrl);

  if (error) return { error: error.message };

  revalidatePath("/library");
  return { success: true };
}

export async function getUserBookmarks(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookmarks")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function isBookmarked(
  userId: string,
  videoUrl: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("video_url", videoUrl)
    .maybeSingle();
  return !!data;
}
