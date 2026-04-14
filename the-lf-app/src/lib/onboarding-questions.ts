export interface OnboardingAnswers {
  canSolve?: string;
  currentAverage?: string;
  primaryGoal?: string;
  method?: string;
}

export interface Question {
  id: keyof OnboardingAnswers;
  text: string;
  options: string[];
  showIf?: (answers: OnboardingAnswers) => boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: "canSolve",
    text: "Can you solve a Rubik's Cube?",
    options: ["Yes", "No"],
  },
  {
    id: "currentAverage",
    text: "What is your current 3×3 average?",
    options: [
      "Under 2 minutes",
      "Sub-1 minute",
      "Sub-30 seconds",
      "Sub-15 seconds",
      "Sub-10 seconds",
      "I don't know",
    ],
    showIf: (answers) => answers.canSolve === "Yes",
  },
  {
    id: "primaryGoal",
    text: "What is your primary goal?",
    options: [
      "Learn to solve for first time",
      "Get faster (general improvement)",
      "Break a specific barrier",
      "Prepare for competition",
    ],
  },
  {
    id: "method",
    text: "What solving method do you use?",
    options: ["CFOP", "Roux", "Beginner method", "I don't know"],
  },
];

export function getVisibleQuestions(answers: OnboardingAnswers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}
