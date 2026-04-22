"use client";

import { ChevronDown, ChevronRight, MessageCircle, Upload } from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";

type State = "idle" | "uploading" | "processing" | "complete";
type Method = "cfop" | "roux";

const PHASES = [
  {
    id: "cross",
    name: "Cross",
    t: "0:00–0:02",
    alg: null as string | null,
    obs: "Clean cross in 2 moves from inspection. No hesitation.",
    rec: "Nothing to fix here.",
  },
  {
    id: "f2l1",
    name: "F2L Pair 1",
    t: "0:02–0:05",
    alg: "F R U R\u2019 U\u2019 F\u2019",
    obs: "Solid execution but a 0.4s pause between cross\u2192F2L1.",
    rec: "Practice locating the next F2L pair during cross execution.",
  },
  {
    id: "f2l2",
    name: "F2L Pair 2",
    t: "0:05–0:08",
    alg: "U R U\u2019 R\u2019",
    obs: "0.7s pause looking for the next pair \u2014 the longest in the solve.",
    rec: "F2L lookahead drills (recommended below).",
  },
  {
    id: "oll",
    name: "OLL",
    t: "0:11–0:13",
    alg: "OLL #27 (Sune)",
    obs: "Recognised quickly; execution is fluent.",
    rec: "No changes needed.",
  },
  {
    id: "pll",
    name: "PLL",
    t: "0:13–0:14",
    alg: "PLL: T-Perm",
    obs: "Clean execution with U2 AUF.",
    rec: "Try learning the mirror to halve AUF.",
  },
];

export function AnalysisClient() {
  const [state, setState] = useState<State>("idle");
  const [method, setMethod] = useState<Method>("cfop");
  const [progress, setProgress] = useState(0);
  const [openPhase, setOpenPhase] = useState<string | null>("cross");

  function startMockUpload() {
    setState("uploading");
    setProgress(0);
    let p = 0;
    const interval = setInterval(() => {
      p += 15;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(interval);
        setState("processing");
        setTimeout(() => setState("complete"), 1400);
      }
    }, 180);
  }

  if (state === "uploading" || state === "processing") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {state === "uploading"
              ? "Uploading\u2026"
              : "Analysing your solve\u2026"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {state === "uploading"
              ? "Sending the video to secure storage."
              : "Gemini is watching frame-by-frame. Usually takes 10\u201330 seconds."}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-200"
              style={{
                width: state === "uploading" ? `${progress}%` : "100%",
              }}
            />
          </div>
          <p className="mt-3 font-mono text-xs text-muted-foreground">
            {state === "uploading"
              ? `${progress}% \u00b7 solve.mp4 \u00b7 14.2 MB`
              : "phase-detection \u00b7 gemini-1.5-pro"}
          </p>
        </div>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Solve analysis
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              CFOP \u00b7 14.21s \u00b7 uploaded just now
            </p>
          </div>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-accent"
          >
            New analysis
          </button>
        </div>

        {/* Summary */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Summary
          </p>
          <h3 className="mb-2 mt-2 text-lg font-semibold tracking-tight text-foreground">
            Strong execution, lookahead is the next unlock.
          </h3>
          <p className="text-sm text-muted-foreground">
            Your algorithms are clean and recognition is fast. Almost a full
            second is being lost between F2L pairs \u2014 that\u2019s the
            highest-impact area to drill.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
              Top priority \u00b7 F2L lookahead
            </span>
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
              Algorithm execution: clean
            </span>
            <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-foreground">
              Cross: optimal
            </span>
          </div>
        </div>

        {/* Phase breakdown */}
        <h3 className="text-sm font-semibold text-foreground">
          Phase breakdown
        </h3>
        <div className="flex flex-col gap-2">
          {PHASES.map((p) => {
            const isOpen = openPhase === p.id;
            return (
              <div
                key={p.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setOpenPhase(isOpen ? null : p.id)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/60"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="text-sm font-medium text-foreground">
                      {p.name}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.t}
                    </span>
                  </div>
                  {p.alg && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {p.alg}
                    </span>
                  )}
                </button>
                {isOpen && (
                  <div className="flex flex-col gap-3 px-4 pb-4 pl-11">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Observation
                      </p>
                      <p className="mt-1 text-sm text-foreground">{p.obs}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                        Recommendation
                      </p>
                      <p className="mt-1 text-sm text-foreground">{p.rec}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          <MessageCircle className="h-4 w-4" />
          Chat with your coach
        </button>
      </div>
    );
  }

  // Idle
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-foreground">
          Solving method
        </h3>
        <div className="flex gap-2">
          {(["cfop", "roux"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "inline-flex h-9 min-w-24 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors",
                method === m
                  ? "bg-foreground text-background"
                  : "border border-border text-foreground shadow-xs hover:bg-accent",
              )}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-transparent px-8 py-12 text-center">
        <Upload className="h-8 w-8 text-muted-foreground" />
        <div className="text-base font-medium text-foreground">
          Drop a solve video here
        </div>
        <p className="text-xs text-muted-foreground">
          mp4 \u00b7 mov \u00b7 webm \u00b7 max 2 minutes \u00b7 max 200 MB
        </p>
        <button
          type="button"
          onClick={startMockUpload}
          className="mt-2 inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
        >
          Choose file
        </button>
      </div>
    </div>
  );
}
