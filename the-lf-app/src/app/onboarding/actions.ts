"use server";

import { redirect } from "next/navigation";
import type { OnboardingAnswers } from "~/lib/onboarding-questions";
import { createClient } from "~/lib/supabase/server";
import type { Database } from "~/types/database";

type ProfileUpsert = Database["public"]["Tables"]["user_profiles"]["Insert"];

type Method = "cfop" | "roux" | "beginner" | "unknown";

const METHOD_MAP: Record<string, Method> = {
  CFOP: "cfop",
  Roux: "roux",
  "Beginner method": "beginner",
  "I don't know": "unknown",
};

export async function saveOnboardingAnswers(
  answers: Required<OnboardingAnswers>,
): Promise<{ error: string } | never> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const upsert: ProfileUpsert = {
    id: user.id,
    display_name: answers.name ?? null,
    knows_how_to_solve: answers.canSolve === "Yes",
    current_average: answers.currentAverage ?? null,
    primary_goal: answers.primaryGoal,
    method: METHOD_MAP[answers.method] ?? "unknown",
    onboarding_complete: true,
  };

  const { error } = await supabase
    .from("user_profiles")
    .upsert(upsert, { onConflict: "id" });

  if (error) {
    console.error("[onboarding] upsert failed:", error.message);
    return { error: error.message };
  }

  redirect("/dashboard");
}
