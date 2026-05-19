export interface OnboardingAnswers {
  name?: string;
  canSolve?: string;
  currentAverage?: string;
  primaryGoal?: string;
  method?: string;
  cfopLevel?: string;
  f2lFoundation?: string;
  crossSpeed?: string;
  colorNeutrality?: string;
  colorNeutralColor?: string;
}

export interface Question {
  id: keyof OnboardingAnswers;
  text: string;
  type?: "options" | "text";
  options?: string[];
  placeholder?: string;
  showIf?: (answers: OnboardingAnswers) => boolean;
}

export const QUESTIONS: Question[] = [
  {
    id: "name",
    text: "What should we call you?",
    type: "text",
    placeholder: "Your name",
  },
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
  {
    id: "cfopLevel",
    text: "How far are you with last-layer recognition?",
    options: [
      "Not yet — still using a beginner last layer",
      "I know 2-look OLL",
      "I know 2-look OLL + 2-look PLL",
      "I know full OLL / PLL",
    ],
    showIf: (answers) => answers.method === "CFOP",
  },
  {
    id: "f2lFoundation",
    text: "How's your F2L?",
    options: [
      "Yes — I solve all 4 slots intuitively",
      "Mostly — I mix intuitive and algorithms",
      "Still learning — I rely on algorithms",
      "I use the beginner layer-by-layer method",
    ],
    showIf: (answers) => answers.method === "CFOP",
  },
  {
    id: "crossSpeed",
    text: "Can you solve the cross in under 8 seconds?",
    options: [
      "Yes — consistently under 8 seconds",
      "Sometimes — still developing",
      "Not yet — my cross takes longer",
    ],
    showIf: (answers) => answers.method === "CFOP",
  },
  {
    id: "colorNeutrality",
    text: "Which color(s) do you start your solve on?",
    options: [
      "White/Yellow (both)",
      "White only",
      "Fully color neutral",
      "Other (specify)",
    ],
    showIf: (answers) => answers.canSolve === "Yes",
  },
  {
    id: "colorNeutralColor",
    text: "Which color do you start on?",
    type: "text",
    placeholder: "e.g. Green",
    showIf: (answers) => answers.colorNeutrality === "Other (specify)",
  },
];

export function getVisibleQuestions(answers: OnboardingAnswers): Question[] {
  return QUESTIONS.filter((q) => !q.showIf || q.showIf(answers));
}
