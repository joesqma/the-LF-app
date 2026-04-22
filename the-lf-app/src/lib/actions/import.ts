"use server";

import { createClient } from "~/lib/supabase/server";

export interface CsTimerSolveInput {
  timeMs: number;
  scramble: string;
  penalty: "dnf" | "+2" | null;
  createdAt: string;
}

export interface CsTimerSessionInput {
  sessionName: string;
  solves: CsTimerSolveInput[];
}

export interface ImportSummary {
  sessionsCreated: number;
  solvesImported: number;
  errors: string[];
}

export async function importFromCsTimer(
  userId: string,
  sessions: CsTimerSessionInput[],
): Promise<ImportSummary> {
  const supabase = await createClient();
  let sessionsCreated = 0;
  let solvesImported = 0;
  const errors: string[] = [];

  for (const session of sessions) {
    try {
      const { data: newSession, error: sessionError } = await supabase
        .from("solve_sessions")
        .insert({ user_id: userId, name: `${session.sessionName} (imported)` })
        .select()
        .single();

      if (sessionError || !newSession) {
        errors.push(
          `Failed to create session "${session.sessionName}": ${sessionError?.message ?? "unknown"}`,
        );
        continue;
      }

      sessionsCreated++;

      const rows = session.solves.map((solve) => ({
        session_id: newSession.id,
        user_id: userId,
        time_ms: solve.timeMs,
        scramble: solve.scramble || null,
        penalty: solve.penalty,
        created_at: solve.createdAt,
      }));

      const { error: solvesError } = await supabase.from("solves").insert(rows);

      if (solvesError) {
        errors.push(
          `Failed to import solves for "${session.sessionName}": ${solvesError.message}`,
        );
      } else {
        solvesImported += rows.length;
      }
    } catch (err) {
      errors.push(
        `Unexpected error for session "${session.sessionName}": ${String(err)}`,
      );
    }
  }

  return { sessionsCreated, solvesImported, errors };
}
