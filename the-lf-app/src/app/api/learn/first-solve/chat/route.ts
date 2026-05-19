import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import type { NextRequest } from "next/server";
import { env } from "~/env";
import { FIRST_SOLVE_STEPS } from "~/lib/content/first-solve";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    message?: string;
    stepId?: number;
    imageBase64?: string;
    imageMimeType?: string;
  };
  const message = body.message?.trim();
  const stepId = body.stepId;
  const imageBase64 = body.imageBase64;
  const imageMimeType = body.imageMimeType;

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

  const systemPrompt = `You are an expert, patient speedcubing coach helping a complete beginner learn to solve a Rubik's Cube on a web app.

The student is currently on this step:
Step ${step.id + 1} of 7: ${step.name}
Description: ${step.desc}

CRITICAL RULES:
1. PLAIN TEXT ONLY: You must not use any markdown formatting. Never use asterisks (*), hash symbols (#), bolding, or italics in your response.
2. CONDITIONAL IMAGE ANALYSIS:
   - IF A PHOTO IS UPLOADED: You must identify the specific target pieces for the current step. Pinpoint their exact current location in the photo (e.g., "The white-red edge piece is on the right side"). Base your steps entirely on moving those specific pieces.
   - IF NO PHOTO IS UPLOADED: Do not guess or invent piece locations. Provide the general algorithmic steps for the current stage.
3. LANGUAGE AND NOTATION: Explain physical moves clearly, immediately followed by the standard cubing notation in parentheses. Example: Turn the right face away from you (R).
4. VIDEO REFERENCE: Explicitly mention the video tutorial provided on the page.
5. SPACING: Use line breaks between your steps to ensure it is easy to read.

REQUIRED RESPONSE STRUCTURE:
Always format your reply exactly like this, using these exact text headings:

Clarify:
[Write 1 to 3 short sentences. Acknowledge their question. IF a photo is provided, state the exact location of the target pieces. IF no photo is provided, simply validate their question. Remind them that the video on the page shows this scenario.]

Steps to solve:
1. [First descriptive instruction. IF a photo is provided, target the specific piece you identified. IF no photo, explain the general setup move. Follow with (Notation).]
2. [Second descriptive instruction. Explain the physical move clearly, followed by the (Notation).]
3. [Continue as needed.]`;

  try {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    });

    const parts: Part[] = [];
    if (imageBase64 && imageMimeType) {
      parts.push({
        inlineData: { mimeType: imageMimeType, data: imageBase64 },
      });
    }
    parts.push({ text: message });

    const result = await model.generateContent(parts);
    const reply = result.response.text();

    return Response.json({ reply });
  } catch (err) {
    console.error("[first-solve/chat] Gemini error:", err);
    return Response.json({ error: "coach_unavailable" }, { status: 500 });
  }
}
