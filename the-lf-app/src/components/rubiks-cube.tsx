"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const COLORS = {
  right: "#c41e3a",
  left: "#ff8c00",
  top: "#ffffff",
  bottom: "#ffd700",
  front: "#009b48",
  back: "#0045ad",
  inner: "#111111",
};

const SIZE = 0.9;
const GAP = 0.06;
const STEP = SIZE + GAP;

function Cubie({ x, y, z }: { x: number; y: number; z: number }) {
  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({
        color: x === 1 ? COLORS.right : COLORS.inner,
      }),
      new THREE.MeshStandardMaterial({
        color: x === -1 ? COLORS.left : COLORS.inner,
      }),
      new THREE.MeshStandardMaterial({
        color: y === 1 ? COLORS.top : COLORS.inner,
      }),
      new THREE.MeshStandardMaterial({
        color: y === -1 ? COLORS.bottom : COLORS.inner,
      }),
      new THREE.MeshStandardMaterial({
        color: z === 1 ? COLORS.front : COLORS.inner,
      }),
      new THREE.MeshStandardMaterial({
        color: z === -1 ? COLORS.back : COLORS.inner,
      }),
    ],
    [x, y, z],
  );

  return (
    <mesh position={[x * STEP, y * STEP, z * STEP]} material={materials}>
      <boxGeometry args={[SIZE, SIZE, SIZE]} />
    </mesh>
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
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <directionalLight position={[-5, -5, -3]} intensity={0.3} />
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
