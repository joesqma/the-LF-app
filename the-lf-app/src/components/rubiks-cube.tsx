"use client";

import { OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";

// Stickerless color palette (GAN-style)
const FACE_COLORS = {
  right: "#c41e3a", // red
  left: "#ff6b00", // orange
  top: "#f8f8f8", // white
  bottom: "#ffd500", // yellow
  front: "#009b48", // green
  back: "#0046ad", // blue
} as const;

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

const FACE_CONFIGS = [
  {
    show: (x: number) => x === 1,
    color: FACE_COLORS.right,
    position: [TILE_POS, 0, 0] as [number, number, number],
    rotation: [0, Math.PI / 2, 0] as [number, number, number],
  },
  {
    show: (x: number) => x === -1,
    color: FACE_COLORS.left,
    position: [-TILE_POS, 0, 0] as [number, number, number],
    rotation: [0, -Math.PI / 2, 0] as [number, number, number],
  },
  {
    show: (_: number, y: number) => y === 1,
    color: FACE_COLORS.top,
    position: [0, TILE_POS, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
  },
  {
    show: (_: number, y: number) => y === -1,
    color: FACE_COLORS.bottom,
    position: [0, -TILE_POS, 0] as [number, number, number],
    rotation: [Math.PI / 2, 0, 0] as [number, number, number],
  },
  {
    show: (_: number, __: number, z: number) => z === 1,
    color: FACE_COLORS.front,
    position: [0, 0, TILE_POS] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    show: (_: number, __: number, z: number) => z === -1,
    color: FACE_COLORS.back,
    position: [0, 0, -TILE_POS] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
  },
];

function Cubie({ x, y, z }: { x: number; y: number; z: number }) {
  const visibleFaces = FACE_CONFIGS.filter((f) => f.show(x, y, z));

  return (
    <group position={[x * STEP, y * STEP, z * STEP]}>
      {/* Deep colored tiles — no separate body; the tiles are the piece */}
      {visibleFaces.map((face) => (
        <RoundedBox
          key={`${face.position}`}
          args={[TILE, TILE, EXT]}
          radius={0.045}
          smoothness={4}
          position={face.position}
          rotation={face.rotation}
        >
          <meshPhysicalMaterial
            color={face.color}
            roughness={0.07}
            metalness={0}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
          />
        </RoundedBox>
      ))}
    </group>
  );
}

const POSITIONS = [-1, 0, 1].flatMap((x) =>
  [-1, 0, 1].flatMap((y) => [-1, 0, 1].map((z) => ({ x, y, z }))),
);

function FloatingCube() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.4;
    groupRef.current.rotation.x = 0.3 + Math.sin(t * 0.25) * 0.1;
    groupRef.current.position.y = Math.sin(t * 0.7) * 0.2;
  });

  return (
    <group ref={groupRef}>
      {POSITIONS.map(({ x, y, z }) => (
        <Cubie key={`${x},${y},${z}`} x={x} y={y} z={z} />
      ))}
    </group>
  );
}

export function RubiksCube() {
  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 45 }}>
      {/* Base fill */}
      <ambientLight intensity={0.55} />
      {/* Key light — top right, creates main highlight */}
      <directionalLight position={[6, 10, 6]} intensity={1.8} />
      {/* Fill light — opposite side, softens shadows */}
      <directionalLight position={[-4, 2, -4]} intensity={0.4} />
      {/* Rim light — adds specular gloss pop */}
      <pointLight position={[-3, 5, 2]} intensity={30} color="#ffffff" />

      <FloatingCube />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={(Math.PI * 5) / 6}
      />
    </Canvas>
  );
}
