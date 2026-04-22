"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import type { Database } from "~/types/database";

type Method = "cfop" | "roux" | "beginner" | "unknown";
type ProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];

export type WCAData = {
  name: string;
  wca_id: string;
  best_single: number | null;
  best_average: number | null;
};

export async function updateUserProfile(data: {
  display_name?: string;
  method: Method;
  primary_goal: string;
}): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const update: ProfileUpdate = {
    ...(data.display_name !== undefined && {
      display_name: data.display_name.trim() || null,
    }),
    method: data.method,
    primary_goal: data.primary_goal,
  };

  const { error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function linkWCAProfile(
  wcaId: string,
): Promise<{ error: string } | { success: true; wca_data: WCAData }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const cleanId = wcaId.trim().toUpperCase();

  const res = await fetch(
    `https://www.worldcubeassociation.org/api/v0/persons/${cleanId}`,
    { headers: { Accept: "application/json" } },
  );

  if (!res.ok) {
    return { error: "WCA profile not found. Check the ID and try again." };
  }

  const data = (await res.json()) as {
    person: {
      name: string;
      wca_id: string;
      personal_records?: {
        "333"?: {
          single?: { best: number };
          average?: { best: number };
        };
      };
    };
  };

  const person = data.person;
  const r333 = person.personal_records?.["333"] ?? null;

  const wcaData: WCAData = {
    name: person.name,
    wca_id: person.wca_id,
    best_single: r333?.single?.best ?? null,
    best_average: r333?.average?.best ?? null,
  };

  const update: ProfileUpdate = {
    wca_id: cleanId,
    wca_data: wcaData,
    wca_last_fetched: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true, wca_data: wcaData };
}

export async function unlinkWCAProfile(): Promise<
  { error: string } | { success: true }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const update: ProfileUpdate = {
    wca_id: null,
    wca_data: null,
    wca_last_fetched: null,
  };

  const { error } = await supabase
    .from("user_profiles")
    .update(update)
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/profile");
  return { success: true };
}

export async function signOut(): Promise<never> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
