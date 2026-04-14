"use client";

import { useEffect, useState } from "react";
import { OnboardingCard } from "~/components/onboarding/OnboardingCard";
import {
  getVisibleQuestions,
  type OnboardingAnswers,
} from "~/lib/onboarding-questions";
import { saveOnboardingAnswers } from "./actions";

export default function OnboardingPage() {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Reset state if we land back here (e.g. proxy redirect loop)
  useEffect(() => {
    setSaving(false);
    setSaveError(null);
  }, []);

  const visibleQuestions = getVisibleQuestions(answers);
  const currentQuestion = visibleQuestions[stepIndex];
  const total = visibleQuestions.length;

  async function handleAnswer(answer: string) {
    const updated = { ...answers, [currentQuestion.id]: answer };
    setAnswers(updated);

    const nextVisible = getVisibleQuestions(updated);
    const isLast = stepIndex >= nextVisible.length - 1;

    if (isLast) {
      setSaving(true);
      setSaveError(null);
      const result = await saveOnboardingAnswers(
        updated as Required<OnboardingAnswers>,
      );
      // If we reach here, the server action returned an error instead of redirecting
      if (result?.error) {
        setSaving(false);
        setSaveError(result.error);
      }
      return;
    }

    setStepIndex((i) => i + 1);
  }

  if (!currentQuestion) return null;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      {saving ? (
        <p className="text-sm text-muted-foreground">Setting things up…</p>
      ) : (
        <>
          {saveError && (
            <p className="mb-6 max-w-sm rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-sm text-destructive">
              Something went wrong saving your answers. Please try again.
            </p>
          )}
          <OnboardingCard
            key={currentQuestion.id}
            question={currentQuestion}
            step={stepIndex + 1}
            total={total}
            onAnswer={handleAnswer}
          />
        </>
      )}
    </div>
  );
}
