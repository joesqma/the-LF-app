import { GoogleGenerativeAI } from "@google/generative-ai";
import type { NextRequest } from "next/server";
import { env } from "~/env";
import { FIRST_SOLVE_STEPS } from "~/lib/content/first-solve";
import { createClient } from "~/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { message?: string; stepId?: number };
  const message = body.message?.trim();
  const stepId = body.stepId;

  if (!message)
    return Response.json({ error: "Missing message" }, { status: 400 });
  if (stepId === undefined || stepId === null)
    return Response.json({ error: "Missing stepId" }, { status: 400 });

  const step = FIRST_SOLVE_STEPS.find((s) => s.id === stepId);
  if (!step) return Response.json({ error: "Invalid stepId" }, { status: 400 });

  if (!env.GEMINI_API_KEY) {
    console.error("[first-solve/chat] GEMINI_API_KEY is not set");
    return Response.json({ error: "coach_unavailable" }, { status: 500 });
  }

  const systemPrompt = `You are an expert speedcubing coach helping a complete beginner learn to solve a Rubik's Cube for the first time.

The student is currently on this step:
Step ${step.id + 1} of 7: ${step.name}
Description: ${step.desc}
Key points for this step:
${step.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Answer their question directly and simply. Use plain language — no jargon unless you explain it. Keep your response to 2–3 short paragraphs maximum. Be encouraging and patient. If they seem frustrated, acknowledge it before explaining. Reference the specific step they're on.`;

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    return Response.json({ reply });
  } catch (err) {
    console.error("[first-solve/chat] Gemini error:", err);
    return Response.json({ error: "coach_unavailable" }, { status: 500 });
  }
}
