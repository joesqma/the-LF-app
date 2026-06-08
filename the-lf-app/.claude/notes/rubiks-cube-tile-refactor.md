# Rubik's Cube Tile Refactor — Change Log & Revert Guide

**File changed:** `src/components/rubiks-cube.tsx`  
**Git baseline:** commit `b1703f0` (branch `main`)

---

## What changed and why

The cube previously used a two-layer architecture: a rounded plastic **body** (light gray `RoundedBox`) with thin colored **sticker tiles** sitting on top. This made the cube look like colored tiles attached to a white/gray cube rather than a single colored piece.

Two sessions of edits rewrote the geometry:

### Session 1 — "tiles should make up the piece"
Goal: make the tiles form the piece rather than act as stickers.

| Constant | Before | After |
|---|---|---|
| `BODY_COLOR` | `"#e2e2e2"` (light gray) | `"#111111"` (near-black) |
| `TILE` | `SIZE * 0.84` = 0.756 | unchanged at this point |
| `EXT` | `0.04` | `SIZE / 2` = 0.45 |
| `TILE_POS` (new) | — | `SIZE / 4` = 0.225 |

Tile positions in `FACE_CONFIGS` changed from `SIZE / 2` (= 0.45) to `TILE_POS` (= 0.225) per axis, so each tile spans from the cubie's centre plane inward to its outer face.

### Session 2 — fixing z-fighting, coverage, and lighting artifacts
The EXT = SIZE/2 tiles were flush with the body outer face → z-fighting → broken lighting and reflections. Fix:

| Constant | Before (after session 1) | After (final) |
|---|---|---|
| `BODY_COLOR` | `"#111111"` | **removed entirely** |
| `TILE` | `SIZE * 0.84` = 0.756 | `SIZE` = 0.9 |
| `EXT` | `SIZE / 2` = 0.45 | `SIZE / 2` = 0.45 (unchanged) |
| `TILE_POS` | `SIZE / 4` = 0.225 | `SIZE / 4` = 0.225 (unchanged) |

The body `RoundedBox` (and its `meshPhysicalMaterial`) was **removed from the `Cubie` component entirely**.

---

## Final state (what the file looks like now)

- **No body geometry.** Each cubie is composed only of colored tile slabs.
- `TILE = SIZE` (0.9) — tiles cover the full cubie face; gaps between pieces come from `GAP = 0.06` only.
- `EXT = SIZE / 2` (0.45) — each tile is half a cubie deep, spanning from the cubie centre (0) to the outer face (SIZE/2).
- `TILE_POS = SIZE / 4` (0.225) — the centre of each tile slab along its face normal.
- Tile positions in `FACE_CONFIGS`: `[TILE_POS, 0, 0]`, `[-TILE_POS, 0, 0]`, `[0, TILE_POS, 0]`, etc.
- All tile material properties unchanged: `roughness={0.07}`, `metalness={0}`, `clearcoat={1.0}`, `clearcoatRoughness={0.04}`.

---

## How to fully revert

Apply these exact changes to `src/components/rubiks-cube.tsx`:

### 1. Restore constants (replace the current constant block)

**Remove:**
```ts
const SIZE = 0.9; // cubie size
const GAP = 0.06; // gap between cubies
const STEP = SIZE + GAP;
// Tiles cover the full face (no body border) so the tile IS the piece face.
// Between-piece separation comes from GAP alone.
const TILE = SIZE;
// Each tile is half a cubie deep — together they form the piece volume.
// No separate body exists, so there is nothing to z-fight against.
const EXT = SIZE / 2;
// Tile centre at SIZE/4 → spans from the cubie centre plane (0) to the outer face (SIZE/2).
const TILE_POS = SIZE / 4;
```

**Replace with:**
```ts
// Light gray body — the plastic between tiles
const BODY_COLOR = "#e2e2e2";

const SIZE = 0.9; // cubie size
const GAP = 0.06; // gap between cubies
const STEP = SIZE + GAP;
const TILE = SIZE * 0.84; // tile width/height (leaves a small body border)
const EXT = 0.04; // tile extrusion depth
```

### 2. Restore FACE_CONFIGS positions

All six entries in `FACE_CONFIGS` currently use `TILE_POS` or `-TILE_POS`. Replace each position tuple:

| Face | Current position | Revert to |
|---|---|---|
| right | `[TILE_POS, 0, 0]` | `[SIZE / 2, 0, 0]` |
| left | `[-TILE_POS, 0, 0]` | `[-(SIZE / 2), 0, 0]` |
| top | `[0, TILE_POS, 0]` | `[0, SIZE / 2, 0]` |
| bottom | `[0, -TILE_POS, 0]` | `[0, -(SIZE / 2), 0]` |
| front | `[0, 0, TILE_POS]` | `[0, 0, SIZE / 2]` |
| back | `[0, 0, -TILE_POS]` | `[0, 0, -(SIZE / 2)]` |

### 3. Restore the body RoundedBox in the Cubie component

**Current JSX inside `<group>`:**
```tsx
{/* Deep colored tiles — no separate body; the tiles are the piece */}
{visibleFaces.map((face) => (
```

**Replace with:**
```tsx
{/* Rounded plastic body */}
<RoundedBox args={[SIZE, SIZE, SIZE]} radius={0.09} smoothness={4}>
  <meshPhysicalMaterial
    color={BODY_COLOR}
    roughness={0.35}
    metalness={0}
    clearcoat={0.6}
    clearcoatRoughness={0.25}
  />
</RoundedBox>

{/* Glossy colored tile on each outer face */}
{visibleFaces.map((face) => (
```

---

## No other files changed

`src/components/cube-scene.tsx` is a thin dynamic-import wrapper that simply re-exports `RubiksCube`. It was not modified.
