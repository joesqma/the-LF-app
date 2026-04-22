import type { Lesson } from "./types";

export const COMP_PREP_PHASES = ["Essentials", "Mindset"] as const;

export const compPrepLessons: Lesson[] = [
  {
    id: "comp-scorecard-1",
    track: "comp-prep",
    phase: "Essentials",
    order: 1,
    title: "Reading a WCA Scorecard",
    description:
      "Understand the WCA scorecard format, how times are recorded, and what to do if something goes wrong.",
    estimatedMinutes: 5,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=8dSuMG--wm8",
        title: "WCA Cubing Competition Tutorial",
        source: "World Cube Association",
      },
    ],
    tips: [
      "Check your time on the display before the judge writes it — you can dispute incorrect recordings.",
      "Sign the scorecard only when the written time matches what you saw.",
      "If you disagree with a recorded time, call a delegate immediately — don't wait.",
    ],
  },
  {
    id: "comp-penalties-1",
    track: "comp-prep",
    phase: "Essentials",
    order: 2,
    title: "Avoiding +2 Penalties",
    description:
      "Learn the most common causes of +2 and DNF penalties and how to eliminate them from your solves.",
    estimatedMinutes: 7,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=8dSuMG--wm8",
        title: "WCA Cubing Competition Tutorial",
        source: "World Cube Association",
      },
    ],
    tips: [
      "Starting the timer before the cube leaves the mat is the most common +2.",
      "Any 45°+ rotation of an outer layer at the end of a solve is a +2.",
      "Stopping the timer with your palms, not fingertips, avoids accidental timer lifts.",
    ],
  },
  {
    id: "comp-routine-1",
    track: "comp-prep",
    phase: "Essentials",
    order: 3,
    title: "Pre-Competition Routine",
    description:
      "Build a reliable warm-up and mental routine so you're in peak state before your first attempt.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=qr4-b0_oRN0",
        title: "10 Tips to Prepare for a Cube Competition",
        source: "SpeedCubeReview",
      },
    ],
    tips: [
      "Do 10–15 warm-up solves before your event — don't sit cold.",
      "Arrive early to check venue layout and get comfortable with the timer model being used.",
      "Eat and hydrate — energy crashes mid-round kill times.",
    ],
  },
  {
    id: "comp-nerves-1",
    track: "comp-prep",
    phase: "Mindset",
    order: 1,
    title: "Handling Nerves",
    description:
      "Techniques to manage competition anxiety so nerves improve focus instead of causing mistakes.",
    estimatedMinutes: 8,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=qr4-b0_oRN0",
        title: "10 Tips to Prepare for a Cube Competition",
        source: "SpeedCubeReview",
      },
    ],
    tips: [
      "Controlled breathing (4 counts in, 4 out) before each attempt lowers heart rate measurably.",
      "Focus on process, not time — ask yourself 'did I execute my cross plan?' not 'was that fast?'",
      "Every competitor gets nervous; experienced cubers have learned to use it, not fight it.",
    ],
  },
  {
    id: "comp-consistency-1",
    track: "comp-prep",
    phase: "Mindset",
    order: 2,
    title: "Competing Consistently",
    description:
      "Strategies for turning your best practice averages into repeatable competition results.",
    estimatedMinutes: 10,
    videos: [
      {
        url: "https://www.youtube.com/watch?v=qr4-b0_oRN0",
        title: "10 Tips to Prepare for a Cube Competition",
        source: "SpeedCubeReview",
      },
    ],
    tips: [
      "Your competition average is typically 5–15% slower than home practice — that's normal.",
      "Avoid chasing sub-X on a single attempt; aim for a clean, consistent round.",
      "After a bad solve, immediately reset mentally — every attempt is independent.",
    ],
  },
];
