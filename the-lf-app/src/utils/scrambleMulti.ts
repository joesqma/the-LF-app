export type Puzzle = "3×3" | "2×2";

export const PUZZLES: Puzzle[] = ["3×3", "2×2"];

const WCA_MODIFIERS = ["", "'", "2"] as const;
const AXIS_BY_FACE = {
  U: "UD",
  D: "UD",
  R: "RL",
  L: "RL",
  F: "FB",
  B: "FB",
} as const;

function randomPick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

/**
 * cstimer-style random-move generator:
 * - no immediate face repeats
 * - avoids axis triplets (e.g. R L R, U D U)
 */
function genAxisAware(
  faces: readonly string[],
  modifiers: readonly string[],
  length: number,
): string {
  const moves: string[] = [];
  let lastFace: string | null = null;
  let secondLastFace: string | null = null;
  let lastAxis: string | null = null;
  let secondLastAxis: string | null = null;

  for (let i = 0; i < length; i++) {
    const candidates = faces.filter((face) => {
      if (face === lastFace) return false;
      const axis = AXIS_BY_FACE[face as keyof typeof AXIS_BY_FACE] ?? face;
      if (axis === lastAxis && axis === secondLastAxis) return false;
      if (face === secondLastFace && axis === lastAxis) return false;
      return true;
    });

    const face = randomPick(candidates.length > 0 ? candidates : faces);
    const mod = randomPick(modifiers);
    moves.push(`${face}${mod}`);

    secondLastFace = lastFace;
    lastFace = face;
    secondLastAxis = lastAxis;
    lastAxis = AXIS_BY_FACE[face as keyof typeof AXIS_BY_FACE] ?? face;
  }

  return moves.join(" ");
}

function gen3x3(length = 20): string {
  return genAxisAware(["U", "D", "F", "B", "L", "R"], WCA_MODIFIERS, length);
}

function gen2x2(): string {
  // cstimer's 2x2 random-state uses R/U/F turns.
  return genAxisAware(["R", "U", "F"], WCA_MODIFIERS, 11);
}

export function generateScrambleForPuzzle(puzzle: Puzzle): string {
  switch (puzzle) {
    case "3×3":
      return gen3x3(20);
    case "2×2":
      return gen2x2();
  }
}
