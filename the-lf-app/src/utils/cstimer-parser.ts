export interface CsTimerSolve {
  timeMs: number;
  scramble: string;
  penalty: "dnf" | "+2" | null;
  createdAt: Date;
}

export interface CsTimerSession {
  sessionName: string;
  solves: CsTimerSolve[];
}

// Parses a cstimer .txt export (which is JSON) into structured data.
//
// Root format: { sessionN: SolveEntry[], ..., properties: { sessionData: "{...}" } }
// SolveEntry:  [[penaltyCode, timeMs], scramble, comment, unixTimestamp]
// penaltyCode: 0 = clean, -1 = DNF, 2000 = +2
// Session names live in properties.sessionData (a JSON-within-JSON string).
export function parseCsTimer(json: unknown): CsTimerSession[] {
  if (typeof json !== "object" || json === null || Array.isArray(json)) {
    throw new Error("Invalid cstimer export: expected a JSON object");
  }

  const root = json as Record<string, unknown>;

  // Extract human-readable session names from the nested properties blob
  const sessionNames = new Map<string, string>();
  const props = root.properties;
  if (typeof props === "object" && props !== null && !Array.isArray(props)) {
    const sessionDataRaw = (props as Record<string, unknown>).sessionData;
    if (typeof sessionDataRaw === "string") {
      try {
        const sessionData = JSON.parse(sessionDataRaw) as Record<
          string,
          { name?: string | number }
        >;
        for (const [k, v] of Object.entries(sessionData)) {
          if (v?.name !== undefined) {
            const name = String(v.name);
            sessionNames.set(
              k,
              Number.isNaN(Number(name)) ? name : `Session ${name}`,
            );
          }
        }
      } catch {
        // ignore; fall back to key-based names
      }
    }
  }

  const sessions: CsTimerSession[] = [];

  for (const [key, value] of Object.entries(root)) {
    if (key === "properties") continue;
    if (!Array.isArray(value) || value.length === 0) continue;

    const sessionNum = key.replace(/^session/, "");
    const sessionName = sessionNames.get(sessionNum) ?? key;

    const solves: CsTimerSolve[] = [];

    for (const entry of value) {
      try {
        // entry: [[penaltyCode, timeMs], scramble, comment, unixTimestamp]
        if (!Array.isArray(entry) || entry.length < 2) continue;

        const resultPart = entry[0];
        if (!Array.isArray(resultPart) || resultPart.length < 2) continue;

        const penaltyCode = Number(resultPart[0]);
        const timeMs = Number(resultPart[1]);

        if (!Number.isFinite(timeMs) || timeMs <= 0) continue;

        let penalty: "dnf" | "+2" | null = null;
        if (penaltyCode === -1) penalty = "dnf";
        else if (penaltyCode === 2000) penalty = "+2";

        const scramble =
          typeof entry[1] === "string" ? (entry[1] as string).trim() : "";
        const rawTs = entry[3];
        const timestamp =
          typeof rawTs === "number" && rawTs > 0 ? rawTs * 1000 : Date.now();

        solves.push({
          timeMs,
          scramble,
          penalty,
          createdAt: new Date(timestamp),
        });
      } catch {
        // skip corrupted entry and continue
      }
    }

    if (solves.length > 0) {
      sessions.push({ sessionName, solves });
    }
  }

  return sessions;
}
