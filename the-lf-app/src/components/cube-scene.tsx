"use client";

import dynamic from "next/dynamic";

const RubiksCube = dynamic(
  () => import("~/components/rubiks-cube").then((m) => m.RubiksCube),
  { ssr: false, loading: () => <div className="h-full w-full" /> },
);

export function CubeScene() {
  return <RubiksCube />;
}
