"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";

export async function completeLesson(
  lessonId: string,
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("completed_lessons")
    .eq("id", user.id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const current = (profile?.completed_lessons as string[] | null) ?? [];
  if (current.includes(lessonId)) return { success: true };

  const { error } = await supabase
    .from("user_profiles")
    .update({ completed_lessons: [...current, lessonId] })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/learn");
  revalidatePath("/learn/cfop");
  revalidatePath(`/learn/cfop/${lessonId}`);
  return { success: true };
}
