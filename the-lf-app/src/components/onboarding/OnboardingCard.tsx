"use client";

import { useState } from "react";
import type { Question } from "~/lib/onboarding-questions";
import { cn } from "~/lib/utils";

interface OnboardingCardProps {
  question: Question;
  step: number;
  total: number;
  onAnswer: (answer: string) => void;
}

export function OnboardingCard({
  question,
  step,
  total,
  onAnswer,
}: OnboardingCardProps) {
  const [textValue, setTextValue] = useState("");

  const isText = question.type === "text";

  function handleTextSubmit() {
    const trimmed = textValue.trim();
    if (!trimmed) return;
    onAnswer(trimmed);
    setTextValue("");
  }

  return (
    <div className="animate-fade-up w-full max-w-lg">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Step {step} of {total}
        </span>
        <div className="flex gap-1.5">
          {Array.from({ length: total }, (_, i) => ({
            id: `dot-${i}`,
            filled: i < step,
          })).map((dot) => (
            <div
              key={dot.id}
              className={cn(
                "h-1 w-6 rounded-full transition-colors",
                dot.filled ? "bg-foreground" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <h2 className="mb-8 text-2xl font-bold tracking-tight text-foreground">
        {question.text}
      </h2>

      {/* Input */}
      {isText ? (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={textValue}
            placeholder={question.placeholder ?? ""}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTextSubmit();
            }}
            className="h-12 w-full rounded-xl border border-border bg-card px-5 text-sm text-card-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-0"
          />
          <button
            type="button"
            disabled={!textValue.trim()}
            onClick={handleTextSubmit}
            className="w-full rounded-xl border border-border bg-card px-5 py-4 text-left text-sm font-medium text-card-foreground transition-colors hover:border-foreground/30 hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {question.options?.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => onAnswer(option)}
              className="w-full rounded-xl border border-border bg-card px-5 py-4 text-left text-sm font-medium text-card-foreground transition-colors hover:border-foreground/30 hover:bg-accent"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
