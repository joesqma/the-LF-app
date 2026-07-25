import { unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { FileState, GoogleAIFileManager } from "@google/generative-ai/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { env } from "~/env";
import { createClient } from "~/lib/supabase/server";
import type { AnalysisReport } from "~/types/analysis";
import type { Database, Json } from "~/types/database";

export const maxDuration = 300;

const INLINE_LIMIT = 15 * 1024 * 1024; // 15 MB — use inline data below this

const PROMPT = `You are an expert speedcubing coach analysing a 3x3 Rubik's Cube solve video.
The solver is using [METHOD].[SCRAMBLE]

Analyse the solve and return ONLY a valid JSON object with no additional text, no markdown, no explanation.

Return this exact structure:
{
  "overall_summary": "2-3 sentence summary of the solve",
  "estimated_total_time": "time in seconds as string",
  "top_priorities": ["priority 1", "priority 2", "priority 3"],
  "phases": [
    {
      "name": "phase name",
      "timestamp_start": "0:00",
      "timestamp_end": "0:00",
      "algorithm_identified": "algorithm name or null",
      "observations": "what you observed",
      "recommendation": "specific actionable improvement",
      "move_sequence": ["R", "U", "R'", "U'"],
      "move_count": 4,
      "tps": 3.5
    }
  ],
  "recommended_lesson_ids": ["lesson-id-1", "lesson-id-2"]
}

For CFOP, phases are: Cross, F2L, OLL, PLL.
For Beginner, phases are: White Cross, White Corners, Middle Layer Edges, Yellow Cross, Yellow Corners.

Move recognition rules:
- Watch the video frame-by-frame and record every face turn in standard WCA notation (U, D, R, L, F, B, U', D', R', L', F', B', U2, D2, R2, L2, F2, B2).
- Include wide moves (u, d, r, l, f, b and their variants) and slice moves (M, E, S) if visible.
- move_sequence must list every move in execution order for that phase. If a move is ambiguous or obscured, make your best inference based on cube state before and after.
- move_count is the total number of moves in move_sequence.
- tps is move_count divided by the phase duration in seconds, rounded to 2 decimal places.
- If the video quality or angle makes move detection impossible for a phase, set move_sequence to null, move_count to null, and tps to null.

Focus on: algorithm identification, execution hesitations, phase timing, look-ahead quality, and accurate move-by-move transcription.
Do not return anything except the JSON object.`;

function mimeFromPath(path: string): string {
  if (path.endsWith(".mov")) return "video/quicktime";
  if (path.endsWith(".webm")) return "video/webm";
  return "video/mp4";
}

type AdminClient = ReturnType<typeof createAdminClient<Database>>;

async function runAnalysis(
  admin: AdminClient,
  videoPath: string,
  method: string,
  analysisId: string,
  geminiKey: string,
  scramble: string | null,
) {
  console.log(`[analysis] starting background job for ${analysisId}`);
  try {
    const { data: blob, error: downloadError } = await admin.storage
      .from("solve-videos")
      .download(videoPath);
    if (downloadError || !blob) {
      throw new Error(downloadError?.message ?? "Download failed");
    }

    const buffer = Buffer.from(await blob.arrayBuffer());
    const mimeType = mimeFromPath(videoPath);

    const genAI = new GoogleGenerativeAI(geminiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const scrambleNote = scramble
      ? `\nThe scramble for this solve was: ${scramble}`
      : "";
    const prompt = PROMPT.replace("[METHOD]", method.toUpperCase()).replace(
      "[SCRAMBLE]",
      scrambleNote,
    );

    let videoPart: Part;

    if (buffer.length <= INLINE_LIMIT) {
      videoPart = {
        inlineData: { mimeType, data: buffer.toString("base64") },
      };
    } else {
      const ext = videoPath.split(".").at(-1) ?? "mp4";
      const tmpPath = join(tmpdir(), `cubewise-${analysisId}.${ext}`);
      await writeFile(tmpPath, buffer);
      try {
        const fileManager = new GoogleAIFileManager(geminiKey);
        const uploadResult = await fileManager.uploadFile(tmpPath, {
          mimeType,
          displayName: `solve-${analysisId}`,
        });

        let geminiFile = uploadResult.file;
        while (geminiFile.state === FileState.PROCESSING) {
          await new Promise<void>((r) => setTimeout(r, 2000));
          geminiFile = await fileManager.getFile(geminiFile.name);
        }
        if (geminiFile.state !== FileState.ACTIVE) {
          throw new Error(
            `File in unexpected state: ${String(geminiFile.state)}`,
          );
        }

        videoPart = {
          fileData: { mimeType: geminiFile.mimeType, fileUri: geminiFile.uri },
        };
      } finally {
        await unlink(tmpPath).catch(() => {});
      }
    }

    const result = await model.generateContent([videoPart, { text: prompt }]);
    const raw = result.response.text().trim();
    console.log(
      `[analysis] raw response for ${analysisId}:`,
      raw.slice(0, 300),
    );
    const json = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    let report: AnalysisReport;
    try {
      report = JSON.parse(json) as AnalysisReport;
    } catch (_parseErr) {
      throw new Error(`JSON parse failed. Raw response: ${raw.slice(0, 500)}`);
    }

    await admin
      .from("analyses")
      .update({ status: "complete", report: report as unknown as Json })
      .eq("id", analysisId);
    console.log(`[analysis] complete for ${analysisId}`);
  } catch (err) {
    console.error(`[analysis] failed for ${analysisId}:`, err);
    await admin
      .from("analyses")
      .update({ status: "failed" })
      .eq("id", analysisId);
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as { analysisId?: string };
  if (!body.analysisId) {
    return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });
  }
  const { analysisId } = body;

  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 },
    );
  }

  const admin = createAdminClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } },
  );

  const { data: analysis, error: fetchError } = await admin
    .from("analyses")
    .select("*")
    .eq("id", analysisId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !analysis) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (
    analysis.status !== "pending" &&
    analysis.status !== "failed" &&
    analysis.status !== "processing"
  ) {
    return NextResponse.json({ status: analysis.status });
  }
  if (!analysis.video_path) {
    await admin
      .from("analyses")
      .update({ status: "failed" })
      .eq("id", analysisId);
    return NextResponse.json({ error: "No video path" }, { status: 400 });
  }

  await admin
    .from("analyses")
    .update({ status: "processing" })
    .eq("id", analysisId);

  // Run Gemini pipeline in the background — respond immediately so the browser
  // isn't blocked waiting for a multi-minute API call.
  waitUntil(
    runAnalysis(
      admin,
      analysis.video_path,
      analysis.method ?? "cfop",
      analysisId,
      env.GEMINI_API_KEY,
      analysis.scramble ?? null,
    ),
  );

  return NextResponse.json({ status: "processing" });
}
