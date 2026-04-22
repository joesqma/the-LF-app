"use server";

import { createClient } from "~/lib/supabase/server";

export async function getSessions(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solve_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createSession(userId: string, name: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solve_sessions")
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function renameSession(sessionId: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("solve_sessions")
    .update({ name })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function deleteSession(sessionId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("solve_sessions")
    .delete()
    .eq("id", sessionId);
  if (error) throw error;
}

export async function saveSolve(
  sessionId: string,
  userId: string,
  timeMs: number,
  scramble: string,
  penalty?: "+2" | "dnf" | null,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solves")
    .insert({
      session_id: sessionId,
      user_id: userId,
      time_ms: timeMs,
      scramble,
      penalty: penalty ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getSolves(sessionId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solves")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteSolve(solveId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("solves").delete().eq("id", solveId);
  if (error) throw error;
}

export async function updateSolvePenalty(
  solveId: string,
  penalty: "+2" | "dnf" | null,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("solves")
    .update({ penalty })
    .eq("id", solveId);
  if (error) throw error;
}

export async function saveScrambleToLibrary(
  userId: string,
  scramble: string,
  puzzle: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("saved_scrambles")
    .upsert(
      { user_id: userId, scramble, puzzle },
      { onConflict: "user_id,scramble", ignoreDuplicates: true },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedScramble(scrambleId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("saved_scrambles")
    .delete()
    .eq("id", scrambleId);
  if (error) throw error;
}
