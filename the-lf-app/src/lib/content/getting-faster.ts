import type { Lesson } from "./types";

export const GETTING_FASTER_PHASES = [
  "Technique",
  "Practice Methods",
  "Efficiency",
] as const;

export const gettingFasterLessons: Lesson[] = [
  // ── Technique ─────────────────────────────────────────────────────────────
  {
    id: "gf-technique-1",
    track: "getting-faster",
    phase: "Technique",
    order: 1,
    title: "Fingertrick Foundations",
    description:
      "Build the core hand movements — index-finger pushes, middle-finger pulls, and ring-finger triggers — that underpin every fast algorithm.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=vtPDMT9HHFo",
        title: "Finger Tricks Tutorial for Beginners",
        source: "J Perm",
      },
    ],
    tips: [
      "Master U-move fingertricks before anything else — they appear in nearly every algorithm.",
      "A loose grip with fingertips (not palm) is the foundation of fast turning.",
      "Drill one fingertrick per day until it runs on autopilot.",
    ],
  },
  {
    id: "gf-technique-2",
    track: "getting-faster",
    phase: "Technique",
    order: 2,
    title: "TPS and Smooth Turning",
    description:
      "Increase your turns per second without sacrificing accuracy — the difference between fast and smooth fast.",
    estimatedMinutes: 12,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=vjC3hg2RJ0Q",
        title: "How to Turn Faster",
        source: "CubeSkills",
      },
    ],
    tips: [
      "TPS without accuracy is worthless — prioritise clean locks over raw speed.",
      "Regripping wastes more time than slow individual moves. Minimise regrips first.",
      "Record your solves at 1080p/120fps and watch back at 0.25x to spot wasted motion.",
    ],
  },

  // ── Practice Methods ──────────────────────────────────────────────────────
  {
    id: "gf-practice-1",
    track: "getting-faster",
    phase: "Practice Methods",
    order: 1,
    title: "Structured Practice Sessions",
    description:
      "Random solves plateau fast. Learn how to design intentional sessions that target your actual weaknesses.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Oa5nN6A-GGc",
        title: "How to Get Faster at Solving the Rubik's Cube",
        source: "J Perm",
      },
    ],
    tips: [
      "Spend 20% of practice time identifying weaknesses, 80% drilling them.",
      "Use a session log: note what you drilled and what still felt rough.",
      "Quality of practice beats quantity. 30 focused minutes beats 2 distracted hours.",
    ],
  },
  {
    id: "gf-practice-2",
    track: "getting-faster",
    phase: "Practice Methods",
    order: 2,
    title: "Slow Solving and Lookahead",
    description:
      "The single most effective drill for breaking plateaus: solve at 50% speed with zero pauses.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Oa5nN6A-GGc",
        title: "How to Get Faster at Solving the Rubik's Cube",
        source: "J Perm",
      },
    ],
    tips: [
      "If you pause even once during a slow solve, you've found your bottleneck. Drill that step.",
      "Lookahead is a skill, not a talent — it responds to deliberate practice.",
      "Slow solving at 50% speed for 2 weeks is worth more than 2 months of racing.",
    ],
  },
  {
    id: "gf-practice-3",
    track: "getting-faster",
    phase: "Practice Methods",
    order: 3,
    title: "Drilling Algorithms",
    description:
      "Engrain OLL, PLL, and F2L cases so deeply that execution is purely muscle memory — not conscious thought.",
    estimatedMinutes: 12,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Oa5nN6A-GGc",
        title: "How to Get Faster at Solving the Rubik's Cube",
        source: "J Perm",
      },
    ],
    tips: [
      "Use algorithm trainers (CubeSkills, Tao Yu's trainer) for randomised recognition practice.",
      "Learn finger tricks alongside the algorithm — do not separate execution from technique.",
      "Sub-1-second recognition before worrying about sub-1-second execution.",
    ],
  },

  // ── Efficiency ────────────────────────────────────────────────────────────
  {
    id: "gf-efficiency-1",
    track: "getting-faster",
    phase: "Efficiency",
    order: 1,
    title: "Reducing Rotations",
    description:
      "Every y and x rotation costs time. Learn to eliminate them from F2L and replace with back-slot algorithms.",
    estimatedMinutes: 12,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Oa5nN6A-GGc",
        title: "How to Get Faster at Solving the Rubik's Cube",
        source: "J Perm",
      },
    ],
    tips: [
      "Count your rotations in a recorded solve — most cubers are surprised how many they do.",
      "Back-slot F2L algorithms let you insert pairs without turning the cube.",
      "One rotation eliminated can save 0.3–0.5 seconds per solve.",
    ],
  },
  {
    id: "gf-efficiency-2",
    track: "getting-faster",
    phase: "Efficiency",
    order: 2,
    title: "Eliminating Pauses",
    description:
      "Identify exactly where your solves stop — and build the bridge to seamless, uninterrupted execution.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Oa5nN6A-GGc",
        title: "How to Get Faster at Solving the Rubik's Cube",
        source: "J Perm",
      },
    ],
    tips: [
      "Watch your solve recordings at 0.5x: every pause is a clue.",
      "Pauses between F2L pairs are usually a lookahead problem.",
      "Pauses before OLL/PLL are usually a recognition problem.",
    ],
  },
];
