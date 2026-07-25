import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/database";

export const FREE_LIMITS = {
  analysesPerMonth: 3,
  bookmarks: 20,
} as const;

export async function canUploadAnalysis(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const now = new Date();
  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();
  const { count } = await supabase
    .from("analyses")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth);
  return (count ?? 0) < FREE_LIMITS.analysesPerMonth;
}

export async function canBookmark(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return (count ?? 0) < FREE_LIMITS.bookmarks;
}
