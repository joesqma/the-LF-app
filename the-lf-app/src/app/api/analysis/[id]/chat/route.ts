import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";
import { env } from "~/env";
import { createClient } from "~/lib/supabase/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data: analysis } = await supabase
    .from("analyses")
    .select("id, report")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!analysis) return Response.json({ error: "Not found" }, { status: 401 });

  const body = (await req.json()) as { message?: string };
  const message = body.message?.trim();
  if (!message)
    return Response.json({ error: "Missing message" }, { status: 400 });

  const [chatResult, profileResult] = await Promise.all([
    supabase
      .from("analysis_chats")
      .select("role, content")
      .eq("analysis_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase.from("user_profiles").select("tier").eq("id", user.id).single(),
  ]);

  const existingMessages = chatResult.data ?? [];
  const tier = (profileResult.data?.tier as string | null) ?? "free";

  const userMessageCount = existingMessages.filter(
    (m) => m.role === "user",
  ).length;
  if (tier === "free" && userMessageCount >= 10) {
    return Response.json({ error: "chat_limit_reached" }, { status: 403 });
  }

  await supabase.from("analysis_chats").insert({
    analysis_id: id,
    user_id: user.id,
    role: "user",
    content: message,
  });

  if (!env.GEMINI_API_KEY) {
    console.error(
      "[chat] GEMINI_API_KEY is not set — restart the dev server after editing .env.local",
    );
    return Response.json({ error: "coach_unavailable" }, { status: 500 });
  }

  const systemPrompt = `You are an expert speedcubing coach reviewing a solver's recent 3x3 solve analysis.

Here is the full analysis report:
${JSON.stringify(analysis.report, null, 2)}

Answer the solver's questions about their performance. Reference specific phases, timestamps, and observations from the report directly. Recommend concrete drills and techniques. Be encouraging but honest. Keep responses concise and actionable — no more than 3 short paragraphs unless a longer explanation is genuinely needed.`;

  const geminiHistory = existingMessages.map((msg) => ({
    role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: msg.content }],
  }));

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    await supabase.from("analysis_chats").insert({
      analysis_id: id,
      user_id: user.id,
      role: "assistant",
      content: responseText,
    });

    return Response.json({ reply: responseText });
  } catch (err) {
    console.error("[chat] Gemini error:", err);
    return Response.json({ error: "coach_unavailable" }, { status: 500 });
  }
}
