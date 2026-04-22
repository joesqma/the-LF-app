"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { applyScrambleString, type FaceId } from "~/utils/cube3x3State";

// Solved-state face colours (standard Rubik's cube colouring)
const STICKER_COLORS: Record<FaceId, string> = {
  U: "#e8e8e8", // white
  R: "#cc0000", // red
  F: "#22c55e", // green
  D: "#fde047", // yellow
  L: "#ff7300", // orange
  B: "#3b82f6", // blue
};

const S = 12; // sticker size px
const G = 2; // gap between stickers px
const STEP = S + G;
const FACE = 3 * S + 2 * G; // physical width/height of one face
const FACE_GAP = 3; // gap between faces

// Cross layout:
//    [U]
// [L][F][R][B]
//    [D]
const COL = (n: number) => n * (FACE + FACE_GAP);
const ROW = (n: number) => n * (FACE + FACE_GAP);

const FACE_ORIGINS: Record<FaceId, { x: number; y: number }> = {
  U: { x: COL(1), y: ROW(0) },
  L: { x: COL(0), y: ROW(1) },
  F: { x: COL(1), y: ROW(1) },
  R: { x: COL(2), y: ROW(1) },
  B: { x: COL(3), y: ROW(1) },
  D: { x: COL(1), y: ROW(2) },
};

export interface CubeNetProps {
  scramble: string;
  scale?: number; // desired visual scale; auto-fit will clamp down if needed
}

export function CubeNet({ scramble, scale = 1 }: CubeNetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const state = useMemo(() => applyScrambleString(scramble), [scramble]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };
    update();

    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bbox = useMemo(() => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    for (const face of ["U", "L", "F", "R", "B", "D"] as const) {
      const origin = FACE_ORIGINS[face];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const x = origin.x + c * STEP;
          const y = origin.y + r * STEP;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + S);
          maxY = Math.max(maxY, y + S);
        }
      }
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: (minX + maxX) / 2,
      centerY: (minY + maxY) / 2,
    };
  }, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || size.width <= 0 || size.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const width = size.width;
    const height = size.height;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const g = ctx;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, width, height);

    const marginRatio = 0.08; // small consistent margin
    const availableW = width * (1 - marginRatio * 2);
    const availableH = height * (1 - marginRatio * 2);
    const fitScale = Math.min(
      availableW / bbox.width,
      availableH / bbox.height,
    );
    const finalScale = Math.max(0.01, Math.min(scale, fitScale));

    // Transform pipeline:
    // 1) center in container
    // 2) apply fit scale
    // 3) shift drawing so bbox center maps to origin
    g.translate(width / 2, height / 2);
    g.scale(finalScale, finalScale);
    g.translate(-bbox.centerX, -bbox.centerY);

    function drawFace(originX: number, originY: number, stickers: FaceId[]) {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const id = stickers[r * 3 + c];
          g.fillStyle = STICKER_COLORS[id];
          g.beginPath();
          g.roundRect(originX + c * STEP, originY + r * STEP, S, S, 2);
          g.fill();
        }
      }
    }

    drawFace(FACE_ORIGINS.U.x, FACE_ORIGINS.U.y, state.U);
    drawFace(FACE_ORIGINS.L.x, FACE_ORIGINS.L.y, state.L);
    drawFace(FACE_ORIGINS.F.x, FACE_ORIGINS.F.y, state.F);
    drawFace(FACE_ORIGINS.R.x, FACE_ORIGINS.R.y, state.R);
    drawFace(FACE_ORIGINS.B.x, FACE_ORIGINS.B.y, state.B);
    drawFace(FACE_ORIGINS.D.x, FACE_ORIGINS.D.y, state.D);
  }, [bbox, scale, size.height, size.width, state]);

  return (
    <div ref={containerRef} className="h-full w-full">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden />
    </div>
  );
}
