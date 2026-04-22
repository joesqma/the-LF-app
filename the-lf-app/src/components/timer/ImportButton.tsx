"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { ConfirmDialog } from "~/components/ui/ConfirmDialog";
import {
  type CsTimerSessionInput,
  type ImportSummary,
  importFromCsTimer,
} from "~/lib/actions/import";
import { parseCsTimer } from "~/utils/cstimer-parser";

interface ImportButtonProps {
  userId: string;
  onImportComplete: () => void;
}

export function ImportButton({ userId, onImportComplete }: ImportButtonProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CsTimerSessionInput[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportSummary | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string) as unknown;
        const parsed = parseCsTimer(json);
        if (parsed.length === 0) {
          setError("No valid sessions found in this file.");
          return;
        }
        setPreview(
          parsed.map((s) => ({
            sessionName: s.sessionName,
            solves: s.solves.map((sv) => ({
              timeMs: sv.timeMs,
              scramble: sv.scramble,
              penalty: sv.penalty,
              createdAt: sv.createdAt.toISOString(),
            })),
          })),
        );
        setError(null);
      } catch {
        setError(
          "Could not parse the file. Make sure it's a valid cstimer JSON export.",
        );
      }
    };
    reader.readAsText(file);
  }

  async function handleConfirm() {
    if (!preview) return;
    setLoading(true);
    try {
      const summary = await importFromCsTimer(userId, preview);
      setResult(summary);
      onImportComplete();
    } catch (err) {
      setError(`Import failed: ${String(err)}`);
    } finally {
      setLoading(false);
      setPreview(null);
    }
  }

  const totalSolves = preview?.reduce((n, s) => n + s.solves.length, 0) ?? 0;
  const sessionCount = preview?.length ?? 0;

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".txt,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => {
          setError(null);
          setResult(null);
          fileRef.current?.click();
        }}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Import cstimer data"
      >
        <Upload className="h-3.5 w-3.5" />
        Import
      </button>

      <ConfirmDialog
        open={preview !== null}
        title="Import cstimer data"
        description={`Found ${sessionCount} session${sessionCount === 1 ? "" : "s"} with ${totalSolves} total solve${totalSolves === 1 ? "" : "s"}. Import all?`}
        confirmLabel={loading ? "Importing…" : "Import all"}
        cancelLabel="Cancel"
        disabled={loading}
        onConfirm={handleConfirm}
        onCancel={() => setPreview(null)}
      />

      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-destructive/30 bg-card px-4 py-3 text-sm shadow-md">
          <p className="text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}

      {result && (
        <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-lg border border-border bg-card px-4 py-3 text-sm shadow-md">
          <p className="font-medium text-foreground">Import complete</p>
          <p className="mt-0.5 text-muted-foreground">
            {result.sessionsCreated} session
            {result.sessionsCreated === 1 ? "" : "s"} and{" "}
            {result.solvesImported} solve
            {result.solvesImported === 1 ? "" : "s"} imported.
          </p>
          {result.errors.length > 0 && (
            <p className="mt-1 text-xs text-destructive">
              {result.errors.length} error(s) occurred.
            </p>
          )}
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
          >
            Dismiss
          </button>
        </div>
      )}
    </>
  );
}
