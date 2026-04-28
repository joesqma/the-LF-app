import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: analysis, error } = await supabase
    .from("analyses")
    .select("id, status, report, method, created_at")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(analysis);
}
