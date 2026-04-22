import type { Lesson } from "./types";

// Phase ordering for display and sequential access
export const CFOP_PHASES = ["Cross", "F2L", "OLL", "PLL", "Advanced"] as const;

export const cfopLessons: Lesson[] = [
  // ── Cross ──────────────────────────────────────────────────────────────────
  {
    id: "cfop-cross-1",
    track: "cfop",
    phase: "Cross",
    order: 1,
    title: "Cross Overview",
    description:
      "Understand the goal of the cross, colour neutrality basics, and how to inspect before starting the solve.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=MS5jByTX_pk",
        title: "CFOP Tutorial – Cross",
        source: "J Perm",
      },
    ],
    tips: [
      "Always solve the cross on the bottom, not the top.",
      "Use your 15-second inspection to plan 2–3 cross pieces before touching the cube.",
      "Aim for a cross in 8 moves or fewer.",
    ],
  },
  {
    id: "cfop-cross-2",
    track: "cfop",
    phase: "Cross",
    order: 2,
    title: "Efficient Cross on Bottom",
    description:
      "Learn to solve the cross in under 8 moves using efficient edge insertion techniques and avoiding common mistakes.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=O2QsDXcaXbA",
        title: "Cross Efficiency Tips",
        source: "CubeSkills",
      },
    ],
    tips: [
      "Practice solving the cross blindfolded to build muscle memory.",
      "Learn to insert cross edges without disrupting already-placed pieces.",
      "Track your cross solve time separately — it should average under 2 seconds.",
    ],
  },

  // ── F2L ───────────────────────────────────────────────────────────────────
  {
    id: "cfop-f2l-1",
    track: "cfop",
    phase: "F2L",
    order: 1,
    title: "F2L Introduction",
    description:
      "Learn the concept of pairing a corner with its edge and inserting them together into a slot intuitively.",
    estimatedMinutes: 20,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "Learn F2L in 6 Minutes (Full Intuitive F2L Tutorial)",
        source: "J Perm",
      },
      {
        url: "https://www.youtube.com/watch?v=O2QsDXcaXbA",
        title: "F2L Basics",
        source: "CubeSkills",
      },
    ],
    tips: [
      "Learn F2L intuitively first — do not memorise algorithms at this stage.",
      "The two core cases are: corner on top/edge on top, and corner on bottom/edge somewhere.",
      "Slot order doesn't matter; work with whichever pair is easiest to see.",
    ],
  },
  {
    id: "cfop-f2l-2",
    track: "cfop",
    phase: "F2L",
    order: 2,
    title: "F2L Slot FR",
    description:
      "Drill every case for the Front-Right slot until insertion is automatic and consistent.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "Learn F2L in 6 Minutes",
        source: "J Perm",
      },
    ],
    tips: [
      "Pause after inserting each pair and immediately look for the next one.",
      "The FR slot is usually solved first because it's easiest to see during inspection.",
    ],
  },
  {
    id: "cfop-f2l-3",
    track: "cfop",
    phase: "F2L",
    order: 3,
    title: "F2L Slot FL",
    description:
      "Build the same fluency for the Front-Left slot, including awkward connected-pair cases.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "Learn F2L in 6 Minutes",
        source: "J Perm",
      },
    ],
    tips: [
      "Mirror the FR algorithms on the left side — you can derive FL from FR intuitively.",
      "Watch out for the case where the corner is flipped in the slot.",
    ],
  },
  {
    id: "cfop-f2l-4",
    track: "cfop",
    phase: "F2L",
    order: 4,
    title: "F2L Slot BR",
    description:
      "Handle Back-Right slot insertions smoothly, including cases where pieces are stuck in wrong slots.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "Learn F2L in 6 Minutes",
        source: "J Perm",
      },
    ],
    tips: [
      "When a piece is stuck in the wrong slot, extract it before re-inserting.",
      "Regrip so back-slot moves use the same finger tricks as front-slot moves.",
    ],
  },
  {
    id: "cfop-f2l-5",
    track: "cfop",
    phase: "F2L",
    order: 5,
    title: "F2L Slot BL",
    description:
      "Complete your F2L toolkit by mastering the hardest-to-see Back-Left slot.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "Learn F2L in 6 Minutes",
        source: "J Perm",
      },
    ],
    tips: [
      "Use a y-rotation if the BL slot feels awkward — it's fine at this stage.",
      "Aim to eliminate y-rotations over time by learning the back-slot cases from a fixed grip.",
    ],
  },
  {
    id: "cfop-f2l-6",
    track: "cfop",
    phase: "F2L",
    order: 6,
    title: "F2L Tricks",
    description:
      "Speed up F2L with advanced techniques: multislotting, corner-first, and common algorithm shortcuts.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "Learn F2L in 6 Minutes",
        source: "J Perm",
      },
    ],
    tips: [
      "Multislotting means solving two pairs simultaneously — watch for opportunities during lookahead.",
      "Corner-first cases can save moves when the edge is already in position.",
      "Don't chase tricks at the expense of lookahead — flow matters more than move-count tricks.",
    ],
  },

  // ── OLL ───────────────────────────────────────────────────────────────────
  {
    id: "cfop-oll-1",
    track: "cfop",
    phase: "OLL",
    order: 1,
    title: "2-Look OLL",
    description:
      "Orient the last layer in two steps using just 3+7 algorithms — the fastest path to a complete CFOP solve.",
    estimatedMinutes: 20,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=GhmYBgLoQQg",
        title: "Rubik's Cube: Easy 2-Look OLL Tutorial",
        source: "J Perm",
      },
    ],
    tips: [
      "2-Look OLL uses the cross (FRURUF) and then 7 corner algorithms.",
      "Learn to recognise each case from any angle before memorising the algorithm.",
      "Sune and Anti-Sune are the two most important — they solve 4 of the 7 cases.",
    ],
  },
  {
    id: "cfop-oll-2",
    track: "cfop",
    phase: "OLL",
    order: 2,
    title: "Full OLL Part 1",
    description:
      "Learn OLL cases 1–28: dot, line, L-shapes, and C/S cases to start cutting your OLL to one look.",
    estimatedMinutes: 30,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=vU6HsK3hvQs",
        title: "All 57 OLL Algorithms & Finger Tricks",
        source: "J Perm",
      },
    ],
    tips: [
      "Group OLLs by the number of oriented edges on top — it narrows recognition fast.",
      "Learn finger tricks alongside each algorithm, not after.",
      "Drill new OLLs on a scrambled top layer before adding them to full solves.",
    ],
  },
  {
    id: "cfop-oll-3",
    track: "cfop",
    phase: "OLL",
    order: 3,
    title: "Full OLL Part 2",
    description:
      "Complete all 57 OLL cases, focusing on the tricky T, W, and square shapes.",
    estimatedMinutes: 30,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=vU6HsK3hvQs",
        title: "All 57 OLL Algorithms & Finger Tricks",
        source: "J Perm",
      },
    ],
    tips: [
      "After learning all 57, rotate through them randomly using an OLL trainer.",
      "Aim for sub-2-second OLL recognition before worrying about execution speed.",
      "Some OLLs have better alternatives — check community-preferred algs on algdb.net.",
    ],
  },

  // ── PLL ───────────────────────────────────────────────────────────────────
  {
    id: "cfop-pll-1",
    track: "cfop",
    phase: "PLL",
    order: 1,
    title: "2-Look PLL",
    description:
      "Permute the last layer in two steps using just 6 algorithms — enough to finish a full CFOP solve.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=9r_HqG4zSbk",
        title: "All 21 PLL Algorithms & Finger Tricks",
        source: "J Perm",
      },
    ],
    tips: [
      "2-Look PLL: first permute corners (A, E perms or skip), then edges (U, Z, H perms).",
      "U perms are the most common PLL cases — drill them until they're under 1 second.",
      "The T perm is a great first full PLL to learn because of its clean finger tricks.",
    ],
  },
  {
    id: "cfop-pll-2",
    track: "cfop",
    phase: "PLL",
    order: 2,
    title: "Full PLL",
    description:
      "Learn all 21 PLL algorithms and their preferred execution angles to consistently one-look PLL.",
    estimatedMinutes: 45,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=9r_HqG4zSbk",
        title: "All 21 PLL Algorithms & Finger Tricks",
        source: "J Perm",
      },
    ],
    tips: [
      "Learn which angle to execute each PLL from — most PLLs have a preferred AUF.",
      "Group PLLs: G perms, N perms, F/V/Y, etc. Learn within groups.",
      "Drill with a PLL trainer (like CubeSkills or Tao Yu's trainer) daily until recognition is instant.",
    ],
  },

  // ── Advanced ──────────────────────────────────────────────────────────────
  {
    id: "cfop-adv-1",
    track: "cfop",
    phase: "Advanced",
    order: 1,
    title: "F2L Lookahead",
    description:
      "Learn to track the next F2L pair while executing the current one, eliminating pauses between pairs.",
    estimatedMinutes: 15,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=Ar_Zit1VLG0",
        title: "F2L Lookahead Techniques",
        source: "J Perm",
      },
    ],
    tips: [
      "Slow down — lookahead is easier at 60% speed. Gradually increase once tracking clicks.",
      "Pick one piece to track while solving the current pair. Don't try to track both pieces at once.",
      "Practice on easy F2L cases so your hands can run on autopilot while your eyes plan ahead.",
    ],
  },
  {
    id: "cfop-adv-2",
    track: "cfop",
    phase: "Advanced",
    order: 2,
    title: "TPS and Fingertricks",
    description:
      "Increase your turns-per-second through proper finger technique, regrips, and smooth algorithm execution.",
    estimatedMinutes: 20,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=vU6HsK3hvQs",
        title: "Finger Tricks & TPS",
        source: "J Perm",
      },
    ],
    tips: [
      "Index-finger push on U moves and middle-finger pull on D moves are the two highest-leverage habits.",
      "Avoid death-gripping the cube — a loose grip enables faster turning.",
      "Record your solves and watch them back at 0.5x speed to spot unnecessary regrips.",
    ],
  },
];
