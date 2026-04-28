import type { NextRequest } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { lessonId?: string };
  const lessonId = body.lessonId;
  if (!lessonId || typeof lessonId !== "string")
    return Response.json({ error: "Missing lessonId" }, { status: 400 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("completed_lessons")
    .eq("id", user.id)
    .single();

  const current = (profile?.completed_lessons as string[] | null) ?? [];
  if (current.includes(lessonId)) return Response.json({ success: true });

  await supabase
    .from("user_profiles")
    .update({ completed_lessons: [...current, lessonId] })
    .eq("id", user.id);

  return Response.json({ success: true });
}
