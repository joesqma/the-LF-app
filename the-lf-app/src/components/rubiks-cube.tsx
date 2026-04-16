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

// Light gray body — the plastic between tiles
const BODY_COLOR = "#e2e2e2";

const SIZE = 0.9; // cubie size
const GAP = 0.06; // gap between cubies
const STEP = SIZE + GAP;
const TILE = SIZE * 0.84; // tile width/height (leaves a small body border)
const EXT = 0.04; // tile extrusion depth

// For each possible outer face: which axis/dir triggers it, its color, and
// how to position + rotate the tile so it faces outward.
// Rotation logic: the tile's args are [TILE, TILE, EXT], so its "front" is +Z.
// We rotate so that front points in the face's outward direction.
const FACE_CONFIGS = [
  {
    show: (x: number) => x === 1,
    color: FACE_COLORS.right,
    // Y rotation +π/2 maps local +Z → world +X
    position: [SIZE / 2, 0, 0] as [number, number, number],
    rotation: [0, Math.PI / 2, 0] as [number, number, number],
  },
  {
    show: (x: number) => x === -1,
    color: FACE_COLORS.left,
    // Y rotation -π/2 maps local +Z → world -X
    position: [-(SIZE / 2), 0, 0] as [number, number, number],
    rotation: [0, -Math.PI / 2, 0] as [number, number, number],
  },
  {
    show: (_: number, y: number) => y === 1,
    color: FACE_COLORS.top,
    // X rotation -π/2 maps local +Z → world +Y
    position: [0, SIZE / 2, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
  },
  {
    show: (_: number, y: number) => y === -1,
    color: FACE_COLORS.bottom,
    // X rotation +π/2 maps local +Z → world -Y
    position: [0, -(SIZE / 2), 0] as [number, number, number],
    rotation: [Math.PI / 2, 0, 0] as [number, number, number],
  },
  {
    show: (_: number, __: number, z: number) => z === 1,
    color: FACE_COLORS.front,
    // No rotation needed — local +Z is already world +Z
    position: [0, 0, SIZE / 2] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
  },
  {
    show: (_: number, __: number, z: number) => z === -1,
    color: FACE_COLORS.back,
    // Y rotation π maps local +Z → world -Z
    position: [0, 0, -(SIZE / 2)] as [number, number, number],
    rotation: [0, Math.PI, 0] as [number, number, number],
  },
];

function Cubie({ x, y, z }: { x: number; y: number; z: number }) {
  const visibleFaces = FACE_CONFIGS.filter((f) => f.show(x, y, z));

  return (
    <group position={[x * STEP, y * STEP, z * STEP]}>
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
