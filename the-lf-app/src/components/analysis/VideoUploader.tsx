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
  method: "cfop" | "roux";
  canUpload: boolean;
}

export function VideoUploader({ userId, method, canUpload }: Props) {
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

    if (!canUpload) {
      setPhase({
        kind: "error",
        message:
          "Monthly analysis limit reached. Upgrade to continue analysing.",
      });
      return;
    }

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

    const result = await createAnalysis(userId, path, method);
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
        {/* biome-ignore lint/a11y/noStaticElementInteractions: drop zone handles keyboard via file input button */}
        <div
          className={["anl-dropzone", dragging ? "anl-dropzone-drag" : ""]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <Upload size={28} style={{ color: "var(--text-dim)" }} />
          <p
            className="font-dm-sans"
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginTop: "14px",
            }}
          >
            Drop a solve video here
          </p>
          <p
            className="font-dm-sans"
            style={{
              fontSize: "11px",
              fontWeight: 300,
              color: "var(--text-dimmer)",
              marginTop: "6px",
            }}
          >
            MP4 · MOV · WebM · max 200 MB · max 2 min
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={phase.kind === "validating"}
            className="anl-browse-btn font-dm-sans"
            style={{ marginTop: "20px" }}
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
              style={{ color: "#ef4444", flexShrink: 0 }}
            />
            <span
              className="font-dm-sans"
              style={{ fontSize: "12px", color: "#ef4444" }}
            >
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
          border: "1px solid var(--border)",
          borderRadius: "14px",
          padding: "18px 20px",
          background: "var(--bg-card)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <Film
            size={20}
            style={{
              color: "var(--text-dim)",
              flexShrink: 0,
              marginTop: "1px",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              className="font-dm-sans"
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {phase.file.name}
            </p>
            <p
              className="font-dm-sans"
              style={{
                fontSize: "11px",
                fontWeight: 300,
                color: "var(--text-dimmer)",
              }}
            >
              {fmtDuration(phase.duration)} · {fmtBytes(phase.file.size)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPhase({ kind: "idle" })}
            className="anl-change-btn font-dm-sans"
          >
            Change file
          </button>
        </div>
        <button
          type="button"
          onClick={handleUpload}
          disabled={!canUpload}
          className="anl-analyse-btn font-dm-sans"
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
        border: "1px solid var(--border)",
        borderRadius: "14px",
        padding: "18px 20px",
        background: "var(--bg-card)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <Film
          size={20}
          style={{ color: "var(--text-dim)", flexShrink: 0, marginTop: "1px" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            className="font-dm-sans"
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--text-secondary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {phase.file.name}
          </p>
          <p
            className="font-dm-sans"
            style={{
              fontSize: "11px",
              fontWeight: 300,
              color: "var(--text-dimmer)",
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
            background: "#1d1d1d",
            borderRadius: "2px",
            overflow: "hidden",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              height: "100%",
              background: "var(--accent-blue)",
              width: `${phase.progress}%`,
              borderRadius: "2px",
              transition: "width 0.2s",
            }}
          />
        </div>
        <p
          className="font-dm-sans"
          style={{ fontSize: "11px", color: "var(--text-dimmer)" }}
        >
          {phase.progress}% · Uploading…
        </p>
      </div>
    </div>
  );
}
