import { redirect } from "next/navigation";
import { FIRST_SOLVE_STEPS } from "~/lib/content/first-solve";
import { createClient } from "~/lib/supabase/server";
import { FirstSolveClient } from "./FirstSolveClient";

export default async function FirstSolvePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("completed_lessons")
    .eq("id", user.id)
    .single();

  const completed = new Set<string>(
    (profile?.completed_lessons as string[] | null) ?? [],
  );

  // Derive step states: done | current | todo | locked
  // Sequential: a step is todo only when the previous is done.
  // The first non-done step becomes current.
  type StepState = "done" | "current" | "todo" | "locked";

  let currentAssigned = false;
  let todoAssigned = false;

  const steps = FIRST_SOLVE_STEPS.map((step) => {
    const key = `first-solve-${step.id}`;
    if (completed.has(key)) {
      return { ...step, state: "done" as StepState };
    }
    if (!currentAssigned) {
      currentAssigned = true;
      todoAssigned = false;
      return { ...step, state: "current" as StepState };
    }
    if (!todoAssigned) {
      todoAssigned = true;
      return { ...step, state: "todo" as StepState };
    }
    return { ...step, state: "locked" as StepState };
  });

  const initialStepId =
    steps.find((s) => s.state === "current")?.id ??
    steps.find((s) => s.state === "todo")?.id ??
    FIRST_SOLVE_STEPS[FIRST_SOLVE_STEPS.length - 1].id;

  return <FirstSolveClient steps={steps} initialStepId={initialStepId} />;
}
