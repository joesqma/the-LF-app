/**
 * 2×2 sticker model for net visualization. Faces use row-major indexing (0–3).
 * Sticker values are the face letter of the centre they belong to in the solved cube.
 */

export type FaceId = "U" | "R" | "F" | "D" | "L" | "B";

export type Cube2x2StickerState = Record<FaceId, FaceId[]>;

const FACE_ORDER: FaceId[] = ["U", "R", "F", "D", "L", "B"];

export function solvedCubeState(): Cube2x2StickerState {
  const s = {} as Cube2x2StickerState;
  for (const f of FACE_ORDER) {
    s[f] = Array(4).fill(f) as FaceId[];
  }
  return s;
}

type Axis = "x" | "y" | "z";

interface Vec3 {
  x: -1 | 0 | 1;
  y: -1 | 0 | 1;
  z: -1 | 0 | 1;
}

interface Sticker {
  pos: Vec3;
  normal: Vec3;
  color: FaceId;
}

function toFace(normal: Vec3): FaceId | null {
  if (normal.y === 1) return "U";
  if (normal.y === -1) return "D";
  if (normal.z === 1) return "F";
  if (normal.z === -1) return "B";
  if (normal.x === 1) return "R";
  if (normal.x === -1) return "L";
  return null;
}

function faceIndexToSticker(face: FaceId, index: number): Sticker {
  const r = Math.floor(index / 2);
  const c = index % 2;

  switch (face) {
    case "F":
      return {
        pos: {
          x: (c * 2 - 1) as -1 | 0 | 1,
          y: (1 - r * 2) as -1 | 0 | 1,
          z: 1,
        },
        normal: { x: 0, y: 0, z: 1 },
        color: face,
      };
    case "B":
      return {
        pos: {
          x: (1 - c * 2) as -1 | 0 | 1,
          y: (1 - r * 2) as -1 | 0 | 1,
          z: -1,
        },
        normal: { x: 0, y: 0, z: -1 },
        color: face,
      };
    case "R":
      return {
        pos: {
          x: 1,
          y: (1 - r * 2) as -1 | 0 | 1,
          z: (1 - c * 2) as -1 | 0 | 1,
        },
        normal: { x: 1, y: 0, z: 0 },
        color: face,
      };
    case "L":
      return {
        pos: {
          x: -1,
          y: (1 - r * 2) as -1 | 0 | 1,
          z: (c * 2 - 1) as -1 | 0 | 1,
        },
        normal: { x: -1, y: 0, z: 0 },
        color: face,
      };
    case "U":
      return {
        pos: {
          x: (c * 2 - 1) as -1 | 0 | 1,
          y: 1,
          z: (r * 2 - 1) as -1 | 0 | 1,
        },
        normal: { x: 0, y: 1, z: 0 },
        color: face,
      };
    case "D":
      return {
        pos: {
          x: (c * 2 - 1) as -1 | 0 | 1,
          y: -1,
          z: (1 - r * 2) as -1 | 0 | 1,
        },
        normal: { x: 0, y: -1, z: 0 },
        color: face,
      };
  }
}

function stickerToFaceIndex(sticker: Sticker): [FaceId, number] | null {
  const face = toFace(sticker.normal);
  if (!face) return null;
  const { x, y, z } = sticker.pos;

  let r = 0;
  let c = 0;
  switch (face) {
    case "F":
      r = (1 - y) / 2;
      c = (x + 1) / 2;
      break;
    case "B":
      r = (1 - y) / 2;
      c = (1 - x) / 2;
      break;
    case "R":
      r = (1 - y) / 2;
      c = (1 - z) / 2;
      break;
    case "L":
      r = (1 - y) / 2;
      c = (z + 1) / 2;
      break;
    case "U":
      r = (z + 1) / 2;
      c = (x + 1) / 2;
      break;
    case "D":
      r = (1 - z) / 2;
      c = (x + 1) / 2;
      break;
  }
  return [face, r * 2 + c];
}

function rotateVec90(v: Vec3, axis: Axis, dir: 1 | -1): Vec3 {
  const { x, y, z } = v;
  if (axis === "x") {
    return dir === 1
      ? { x, y: -z as -1 | 0 | 1, z: y }
      : { x, y: z, z: -y as -1 | 0 | 1 };
  }
  if (axis === "y") {
    return dir === 1
      ? { x: z, y, z: -x as -1 | 0 | 1 }
      : { x: -z as -1 | 0 | 1, y, z: x };
  }
  return dir === 1
    ? { x: -y as -1 | 0 | 1, y: x, z }
    : { x: y, y: -x as -1 | 0 | 1, z };
}

function buildSolvedStickers(): Sticker[] {
  const stickers: Sticker[] = [];
  for (const face of FACE_ORDER) {
    for (let i = 0; i < 4; i++) {
      stickers.push(faceIndexToSticker(face, i));
    }
  }
  return stickers;
}

function rotateLayer(
  stickers: Sticker[],
  axis: Axis,
  layerValue: -1 | 0 | 1,
  dir: 1 | -1,
): void {
  for (const sticker of stickers) {
    if (sticker.pos[axis] !== layerValue) continue;
    sticker.pos = rotateVec90(sticker.pos, axis, dir);
    sticker.normal = rotateVec90(sticker.normal, axis, dir);
  }
}

function applyMove(stickers: Sticker[], face: FaceId, turns: 1 | 2 | 3): void {
  const cfg: Record<
    FaceId,
    { axis: Axis; layer: -1 | 1; clockwiseDir: 1 | -1 }
  > = {
    U: { axis: "y", layer: 1, clockwiseDir: -1 },
    D: { axis: "y", layer: -1, clockwiseDir: 1 },
    R: { axis: "x", layer: 1, clockwiseDir: -1 },
    L: { axis: "x", layer: -1, clockwiseDir: 1 },
    F: { axis: "z", layer: 1, clockwiseDir: -1 },
    B: { axis: "z", layer: -1, clockwiseDir: 1 },
  };

  const { axis, layer, clockwiseDir } = cfg[face];
  for (let i = 0; i < turns; i++) {
    rotateLayer(stickers, axis, layer, clockwiseDir);
  }
}

function stickersToState(stickers: Sticker[]): Cube2x2StickerState {
  const state = solvedCubeState();

  for (const sticker of stickers) {
    const mapped = stickerToFaceIndex(sticker);
    if (!mapped) continue;
    const [face, idx] = mapped;
    state[face][idx] = sticker.color;
  }
  return state;
}

export function applyScrambleString(scramble: string): Cube2x2StickerState {
  const stickers = buildSolvedStickers();
  const tokens = scramble.trim().split(/\s+/).filter(Boolean);
  for (const raw of tokens) {
    const t = raw.trim();
    if (!t) continue;
    const face = t[0]?.toUpperCase() as FaceId;
    if (!("UDRLFB" as string).includes(face)) continue;
    const turns: 1 | 2 | 3 = t.endsWith("2") ? 2 : t.endsWith("'") ? 3 : 1;
    applyMove(stickers, face, turns);
  }
  return stickersToState(stickers);
}
