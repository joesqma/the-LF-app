import type { Lesson } from "./types";

export const ROUX_PHASES = [
  "First Block",
  "Second Block",
  "CMLL",
  "LSE",
  "Advanced",
] as const;

export const rouxLessons: Lesson[] = [
  {
    id: "roux-fb-1",
    track: "roux",
    phase: "First Block",
    order: 1,
    title: "First Block Fundamentals",
    description:
      "Build a 1×2×3 block on the left side using efficient pair-then-place techniques.",
    estimatedMinutes: 20,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Roux Method Tutorial – First Block",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "First Block is the hardest step to become efficient at — invest the most practice time here.",
      "Solve FB with the cube on its side (left face facing you) to improve ergonomics.",
      "Build from the bottom: solve the DB edge first, then attach corner-edge pairs.",
    ],
  },
  {
    id: "roux-sb-1",
    track: "roux",
    phase: "Second Block",
    order: 1,
    title: "Second Square",
    description:
      "Complete the 1×2×3 block on the right using the M slice and U layer freely.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Roux Method Tutorial – Second Block",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "Unlike CFOP, the M slice is available during SB — use it freely.",
      "Solve the back-right pair before the front-right for better ergonomics.",
      "Aim for sub-4-second SB before moving to CMLL.",
    ],
  },
  {
    id: "roux-sb-2",
    track: "roux",
    phase: "Second Block",
    order: 2,
    title: "Last Pair",
    description:
      "Efficient techniques for inserting the final SB pair while preserving the first block.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Roux Tutorial – Last Pair",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "Track the last pair during SB build to avoid losing time searching.",
      "Some last-pair cases can be solved with the M slice without rotating.",
    ],
  },
  {
    id: "roux-cmll-1",
    track: "roux",
    phase: "CMLL",
    order: 1,
    title: "CMLL",
    description:
      "Solve all corners of the last layer in one look using 42 algorithms (or 2-look as a starting point).",
    estimatedMinutes: 35,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Roux Tutorial – CMLL",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "Start with 2-look CMLL (orient then permute corners) to get solving sooner.",
      "Sune family cases make up most of CMLL — learn them first.",
      "CMLL recognition is by corner orientation + top sticker pattern, not edges.",
    ],
  },
  {
    id: "roux-lse-1",
    track: "roux",
    phase: "LSE",
    order: 1,
    title: "LSE – Edge Orientation",
    description:
      "Orient all remaining edges using only M and U moves — the first step of Last Six Edges.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Roux Tutorial – LSE EO",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "EO uses only M, M', M2, U, U2, U' — no rotations needed.",
      "Identify misoriented edges by their colour: any edge showing U or D colour on a non-U/D face is bad.",
      "Four arrows pointing in on the top is the fully oriented state.",
    ],
  },
  {
    id: "roux-lse-2",
    track: "roux",
    phase: "LSE",
    order: 2,
    title: "LSE – UL/UR and EP",
    description:
      "Place UL and UR edges, then permute all four U-layer edges to finish the solve.",
    estimatedMinutes: 20,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Roux Tutorial – UL/UR and EP",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "UL/UR placement and EP can often be done in a single fluid step with good lookahead.",
      "The four EP cases are: skip, U perm CW, U perm CCW, and Z perm.",
      "Roux's LSE is entirely gen-M-U — practice until M-slice moves are effortless.",
    ],
  },
  {
    id: "roux-adv-1",
    track: "roux",
    phase: "Advanced",
    order: 1,
    title: "Advanced Roux",
    description:
      "FB lookahead, SB multislotting, and LSEO prediction to push past the 10-second barrier.",
    estimatedMinutes: 25,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=0Cg3qqljMGE",
        title: "Advanced Roux Techniques",
        source: "Kian Mansour",
      },
    ],
    tips: [
      "FB at sub-3 seconds is achievable — it requires heavy block-building practice.",
      "Predict LSEO during CMLL execution to start LSE immediately after.",
      "Study top Roux solvers (Kian, Sean Patrick Villanueva) by reconstructing their solves.",
    ],
  },
];
