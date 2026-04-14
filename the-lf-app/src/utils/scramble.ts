const FACES = ["U", "D", "F", "B", "L", "R"] as const;
const MODIFIERS = ["", "'", "2"] as const;

const OPPOSITE: Record<string, string> = {
  U: "D",
  D: "U",
  F: "B",
  B: "F",
  L: "R",
  R: "L",
};

/**
 * Generates a WCA-style 3×3 scramble of `length` moves.
 * Guarantees no same-face consecutive moves and no R L R (opposite sandwich) patterns.
 */
export function generateScramble(length = 20): string {
  const moves: string[] = [];
  let lastFace: string | null = null;
  let secondLastFace: string | null = null;

  for (let i = 0; i < length; i++) {
    const available = FACES.filter((f) => {
      if (f === lastFace) return false;
      // Prevent X Y X where Y is the opposite of X (e.g. R L R)
      if (secondLastFace === f && lastFace === OPPOSITE[f]) return false;
      return true;
    });

    const face = available[Math.floor(Math.random() * available.length)];
    const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    moves.push(face + mod);
    secondLastFace = lastFace;
    lastFace = face;
  }

  return moves.join(" ");
}
