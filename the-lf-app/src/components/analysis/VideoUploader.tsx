"use client";

import { AlertTriangle, Film, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { env } from "~/env";
import { createAnalysis } from "~/lib/actions/analysis";
import { createClient } from "~/lib/supabase/client";

const ACCEPTED = ["video/mp4", "video/quicktime", "video/webm"];
const MAX_BYTES = 200 * 1024 * 1024;
const MAX_DURATION = 120;

function fmtBytes(b: number) {
  return b < 1024 * 1024
    ? `${(b / 1024).toFixed(1)} KB`
    : `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read video metadata"));
    };
    video.src = url;
  });
}

function fileExt(file: File): string {
  const parts = file.name.split(".");
  return parts.length > 1 ? (parts.at(-1) ?? "mp4") : "mp4";
}

type Phase =
  | { kind: "idle" }
  | { kind: "validating" }
  | { kind: "ready"; file: File; duration: number }
  | { kind: "uploading"; file: File; duration: number; progress: number }
  | { kind: "error"; message: string };

interface Props {
  userId: string;
  method: "cfop" | "beginner";
  scramble: string;
}

const mono: React.CSSProperties = {
  fontFamily: "var(--font-roboto-mono), 'Roboto Mono', monospace",
};
const sans: React.CSSProperties = {
  fontFamily: "var(--font-outfit), 'Outfit', sans-serif",
};

export function VideoUploader({ userId, method, scramble }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [dragging, setDragging] = useState(false);

  const processFile = useCallback(async (file: File) => {
    setPhase({ kind: "validating" });

    if (!ACCEPTED.includes(file.type)) {
      setPhase({
        kind: "error",
        message: `Unsupported format: ${file.type || "unknown"}. Please use MP4, MOV, or WebM.`,
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      setPhase({
        kind: "error",
        message: `File is too large (${fmtBytes(file.size)}). Maximum is 200 MB.`,
      });
      return;
    }

    let duration: number;
    try {
      duration = await getVideoDuration(file);
    } catch {
      setPhase({ kind: "error", message: "Could not read video metadata." });
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setPhase({
        kind: "error",
        message: "Could not determine video duration.",
      });
      return;
    }

    if (duration > MAX_DURATION) {
      setPhase({
        kind: "error",
        message: `Video is ${fmtDuration(duration)} — maximum is 2 minutes.`,
      });
      return;
    }

    setPhase({ kind: "ready", file, duration });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  async function handleUpload() {
    if (phase.kind !== "ready") return;
    const { file, duration } = phase;

    const uuid = crypto.randomUUID();
    const path = `${userId}/${uuid}.${fileExt(file)}`;

    setPhase({ kind: "uploading", file, duration, progress: 0 });

    const supabase = createClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setPhase({ kind: "error", message: "Not authenticated." });
      return;
    }

    const uploadUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/solve-videos/${path}`;
    const uploadError = await new Promise<string | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.setRequestHeader("x-upsert", "false");
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setPhase((prev) =>
            prev.kind === "uploading" ? { ...prev, progress: pct } : prev,
          );
        }
      };
      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          resolve(null);
        } else {
          let detail = xhr.statusText;
          try {
            const body = JSON.parse(xhr.responseText) as {
              message?: string;
              error?: string;
            };
            detail = body.message ?? body.error ?? xhr.statusText;
          } catch {
            /* use statusText */
          }
          resolve(`Upload failed (${xhr.status}): ${detail}`);
        }
      };
      xhr.onerror = () => resolve("Upload failed — check your connection.");
      xhr.send(file);
    });

    if (uploadError) {
      setPhase({ kind: "error", message: uploadError });
      return;
    }

    const result = await createAnalysis(userId, path, method, scramble);
    if ("error" in result) {
      setPhase({ kind: "error", message: result.error });
      return;
    }

    router.push(`/analysis/${result.id}`);
  }

  // ── Idle / validating / error ─────────────────────────────────────────────

  if (
    phase.kind === "idle" ||
    phase.kind === "error" ||
    phase.kind === "validating"
  ) {
    return (
      <div>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: keyboard access via browse button */}
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: keyboard access via browse button */}
        <div
          className={["anl-upload-zone", dragging ? "anl-upload-zone-drag" : ""]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          {/* Upload icon box */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "var(--blue-dim)",
              border: "0.5px solid rgba(0,168,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "4px",
            }}
          >
            <Upload
              size={22}
              strokeWidth={1.5}
              aria-hidden="true"
              style={{ color: "var(--blue)" }}
            />
          </div>

          <p
            style={{
              ...sans,
              fontSize: "14px",
              fontWeight: 600,
              color: "var(--t1)",
            }}
          >
            Drop your solve video here
          </p>

          <p
            style={{
              ...mono,
              fontSize: "10px",
              color: "var(--t3)",
              lineHeight: 1.7,
            }}
          >
            Max 2 min · Max 200 MB
          </p>

          <div
            style={{
              display: "flex",
              gap: "6px",
              justifyContent: "center",
              marginTop: "2px",
            }}
          >
            {(["MP4", "MOV", "WEBM"] as const).map((fmt) => (
              <span
                key={fmt}
                style={{
                  ...mono,
                  fontSize: "9px",
                  fontWeight: 600,
                  padding: "3px 8px",
                  borderRadius: "5px",
                  background: "var(--s2)",
                  border: "0.5px solid var(--b2)",
                  color: "var(--t3)",
                  letterSpacing: "1px",
                }}
              >
                {fmt}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            disabled={phase.kind === "validating"}
            style={{
              ...sans,
              background: "var(--blue)",
              color: "#01111f",
              border: "none",
              borderRadius: "8px",
              padding: "9px 22px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: phase.kind === "validating" ? "default" : "pointer",
              opacity: phase.kind === "validating" ? 0.4 : 1,
              marginTop: "6px",
              transition: "opacity 150ms",
            }}
          >
            {phase.kind === "validating" ? "Checking…" : "Browse file"}
          </button>
        </div>

        {phase.kind === "error" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "10px",
            }}
          >
            <AlertTriangle
              size={12}
              aria-hidden="true"
              style={{ color: "var(--red)", flexShrink: 0 }}
            />
            <span style={{ ...sans, fontSize: "12px", color: "var(--red)" }}>
              {phase.message}
            </span>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          onChange={handleChange}
        />
      </div>
    );
  }

  // ── Ready ─────────────────────────────────────────────────────────────────

  if (phase.kind === "ready") {
    return (
      <div
        style={{
          border: "0.5px solid var(--b2)",
          borderRadius: "14px",
          padding: "16px 20px",
          background: "var(--s1)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "flex-start",
          }}
        >
          <Film
            size={16}
            strokeWidth={1.5}
            aria-hidden="true"
            style={{
              color: "var(--t3)",
              flexShrink: 0,
              marginTop: "2px",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                ...sans,
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--t1)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {phase.file.name}
            </p>
            <p
              style={{
                ...mono,
                fontSize: "10px",
                fontWeight: 400,
                color: "var(--t3)",
                marginTop: "2px",
              }}
            >
              {fmtDuration(phase.duration)} · {fmtBytes(phase.file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPhase({ kind: "idle" })}
            className="anl-change-btn"
          >
            Change
          </button>
        </div>
        <button
          type="button"
          onClick={handleUpload}
          className="anl-analyse-btn"
        >
          Analyse solve →
        </button>
      </div>
    );
  }

  // ── Uploading ─────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        border: "0.5px solid var(--b2)",
        borderRadius: "14px",
        padding: "16px 20px",
        background: "var(--s1)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
        <Film
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          style={{ color: "var(--t3)", flexShrink: 0, marginTop: "2px" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              ...sans,
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--t1)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {phase.file.name}
          </p>
          <p
            style={{
              ...mono,
              fontSize: "10px",
              fontWeight: 400,
              color: "var(--t3)",
              marginTop: "2px",
            }}
          >
            {fmtDuration(phase.duration)} · {fmtBytes(phase.file.size)}
          </p>
        </div>
      </div>
      <div>
        <div
          style={{
            height: "2px",
            background: "var(--b1)",
            borderRadius: "0",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--blue)",
              width: `${phase.progress}%`,
              transition: "width 150ms",
            }}
          />
        </div>
        <p
          style={{
            ...mono,
            fontSize: "10px",
            fontWeight: 400,
            color: "var(--t3)",
          }}
        >
          {phase.progress}% · Uploading…
        </p>
      </div>
    </div>
  );
}
