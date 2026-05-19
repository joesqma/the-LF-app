"use server";

import { redirect } from "next/navigation";
import type { OnboardingAnswers } from "~/lib/onboarding-questions";
import { createClient } from "~/lib/supabase/server";
import type { Database } from "~/types/database";

type ProfileUpsert = Database["public"]["Tables"]["user_profiles"]["Insert"];

type Method = "cfop" | "roux" | "beginner" | "unknown";
type CfopLevel = "none" | "2look_oll" | "2look_both" | "full_ollpll";
type ColorNeutrality =
  | "white_yellow"
  | "white_only"
  | "color_neutral"
  | "other";

const METHOD_MAP: Record<string, Method> = {
  CFOP: "cfop",
  Roux: "roux",
  "Beginner method": "beginner",
  "I don't know": "unknown",
};

const CFOP_LEVEL_MAP: Record<string, CfopLevel> = {
  "Not yet — still using a beginner last layer": "none",
  "I know 2-look OLL": "2look_oll",
  "I know 2-look OLL + 2-look PLL": "2look_both",
  "I know full OLL / PLL": "full_ollpll",
};

const F2L_FOUNDATION_MAP: Record<string, string> = {
  "Yes — I solve all 4 slots intuitively": "full_intuitive",
  "Mostly — I mix intuitive and algorithms": "partial_intuitive",
  "Still learning — I rely on algorithms": "algorithmic",
  "I use the beginner layer-by-layer method": "beginner",
};

const CROSS_SPEED_MAP: Record<string, string> = {
  "Yes — consistently under 8 seconds": "sub8",
  "Sometimes — still developing": "developing",
  "Not yet — my cross takes longer": "over8",
};

const COLOR_NEUTRALITY_MAP: Record<string, ColorNeutrality> = {
  "White/Yellow (both)": "white_yellow",
  "White only": "white_only",
  "Fully color neutral": "color_neutral",
  "Other (specify)": "other",
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
    cfop_level: answers.cfopLevel
      ? (CFOP_LEVEL_MAP[answers.cfopLevel] ?? null)
      : null,
    f2l_foundation: answers.f2lFoundation
      ? (F2L_FOUNDATION_MAP[answers.f2lFoundation] ?? null)
      : null,
    cross_sub8: answers.crossSpeed
      ? (CROSS_SPEED_MAP[answers.crossSpeed] ?? null)
      : null,
    color_neutrality: answers.colorNeutrality
      ? (COLOR_NEUTRALITY_MAP[answers.colorNeutrality] ?? null)
      : null,
    color_neutral_color:
      answers.colorNeutrality === "Other (specify)"
        ? (answers.colorNeutralColor ?? null)
        : null,
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
