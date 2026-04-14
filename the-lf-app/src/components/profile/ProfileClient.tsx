"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  linkWCAProfile,
  unlinkWCAProfile,
  updateUserProfile,
  type WCAData,
} from "~/app/(app)/profile/actions";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type { UserProfile } from "~/types/database";

// ── time helpers ──────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  const s = ms / 1000;
  if (s < 60) return s.toFixed(2);
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toFixed(2).padStart(5, "0")}`;
}

/** WCA times are in centiseconds */
function formatCs(cs: number): string {
  return formatMs(cs * 10);
}

// ── constants ─────────────────────────────────────────────────────────────────

const METHOD_OPTIONS = [
  { value: "cfop", label: "CFOP" },
  { value: "roux", label: "Roux" },
  { value: "beginner", label: "Beginner method" },
  { value: "unknown", label: "I don't know" },
] as const;

const GOAL_OPTIONS = [
  "Learn to solve for first time",
  "Get faster (general improvement)",
  "Break a specific barrier",
  "Prepare for competition",
];

// ── types ─────────────────────────────────────────────────────────────────────

export interface ProfileStats {
  totalSolves: number;
  bestSingle: number | null;
  bestAo5: number | null;
  bestAo12: number | null;
  totalSessions: number;
  memberSince: string;
}

interface Props {
  user: { id: string; email: string };
  profile: UserProfile | null;
  stats: ProfileStats;
}

type Tab = "profile" | "stats" | "achievements";

// ── root component ────────────────────────────────────────────────────────────

export function ProfileClient({ user, profile, stats }: Props) {
  const [tab, setTab] = useState<Tab>("profile");
  const router = useRouter();

  const refresh = () => router.refresh();

  return (
    <div>
      <div className="mb-6 flex border-b border-border">
        {(["profile", "stats", "achievements"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "-mb-px px-4 py-2 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "border-b-2 border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <ProfileTab user={user} profile={profile} onRefresh={refresh} />
      )}
      {tab === "stats" && <StatsTab stats={stats} />}
      {tab === "achievements" && <AchievementsTab />}
    </div>
  );
}

// ── Profile tab ───────────────────────────────────────────────────────────────

function ProfileTab({
  user,
  profile,
  onRefresh,
}: {
  user: Props["user"];
  profile: UserProfile | null;
  onRefresh: () => void;
}) {
  const [method, setMethod] = useState<string>(profile?.method ?? "unknown");
  const [goal, setGoal] = useState<string>(
    profile?.primary_goal ?? GOAL_OPTIONS[0],
  );
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    setMethod(profile?.method ?? "unknown");
    setGoal(profile?.primary_goal ?? GOAL_OPTIONS[0]);
  }, [profile?.method, profile?.primary_goal]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    const result = await updateUserProfile({
      method: method as "cfop" | "roux" | "beginner" | "unknown",
      primary_goal: goal,
    });
    setSaving(false);
    if ("error" in result) {
      setSaveMsg(`Error: ${result.error}`);
    } else {
      setSaveMsg("Saved!");
      onRefresh();
      setTimeout(() => setSaveMsg(null), 2000);
    }
  }

  const displayName = profile?.display_name ?? user.email;
  const avatarUrl = profile?.avatar_url;

  return (
    <div className="space-y-8">
      {/* Identity */}
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={displayName}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-foreground">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-base font-semibold text-foreground">
            {displayName}
          </p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="max-w-sm space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="method"
            className="text-sm font-medium text-foreground"
          >
            Solving method
          </label>
          <select
            id="method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {METHOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="goal" className="text-sm font-medium text-foreground">
            Primary goal
          </label>
          <select
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {GOAL_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" disabled={saving} onClick={handleSave}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          {saveMsg && (
            <span
              className={cn(
                "text-sm",
                saveMsg.startsWith("Error")
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {saveMsg}
            </span>
          )}
        </div>
      </div>

      <WCASection profile={profile} onRefresh={onRefresh} />
    </div>
  );
}

// ── WCA section ───────────────────────────────────────────────────────────────

function WCASection({
  profile,
  onRefresh,
}: {
  profile: UserProfile | null;
  onRefresh: () => void;
}) {
  const [wcaInput, setWcaInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wcaData = profile?.wca_data as WCAData | null;
  const isLinked = !!profile?.wca_id && !!wcaData;

  async function handleLink() {
    if (!wcaInput.trim()) return;
    setLoading(true);
    setError(null);
    const result = await linkWCAProfile(wcaInput);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setWcaInput("");
      onRefresh();
    }
  }

  async function handleUnlink() {
    setLoading(true);
    setError(null);
    const result = await unlinkWCAProfile();
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      onRefresh();
    }
  }

  return (
    <div className="max-w-sm space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">WCA Profile</h3>
        <p className="text-xs text-muted-foreground">
          Link your World Cube Association profile to show official results.
        </p>
      </div>

      {isLinked ? (
        <div className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">
                {wcaData.name}
              </p>
              <p className="text-xs text-muted-foreground">{wcaData.wca_id}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={loading}
              onClick={handleUnlink}
            >
              Unlink
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground">Best single</p>
              <p className="text-sm font-semibold text-foreground">
                {wcaData.best_single != null
                  ? formatCs(wcaData.best_single)
                  : "—"}
              </p>
            </div>
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-xs text-muted-foreground">Best average</p>
              <p className="text-sm font-semibold text-foreground">
                {wcaData.best_average != null
                  ? formatCs(wcaData.best_average)
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="e.g. 2009ZEMD01"
            value={wcaInput}
            onChange={(e) => setWcaInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLink();
            }}
            className="max-w-44"
          />
          <Button
            size="sm"
            disabled={loading || !wcaInput.trim()}
            onClick={handleLink}
          >
            {loading ? "Linking…" : "Link WCA"}
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ── Stats tab ─────────────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: ProfileStats }) {
  const items = [
    { label: "Total solves", value: stats.totalSolves.toLocaleString() },
    {
      label: "Best single",
      value: stats.bestSingle != null ? formatMs(stats.bestSingle) : "—",
    },
    {
      label: "Best Ao5",
      value: stats.bestAo5 != null ? formatMs(stats.bestAo5) : "—",
    },
    {
      label: "Best Ao12",
      value: stats.bestAo12 != null ? formatMs(stats.bestAo12) : "—",
    },
    { label: "Sessions", value: stats.totalSessions.toLocaleString() },
    {
      label: "Member since",
      value: new Date(stats.memberSince).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map(({ label, value }) => (
        <div key={label} className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── Achievements tab ──────────────────────────────────────────────────────────

function AchievementsTab() {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-lg border border-dashed border-border">
      <p className="text-sm text-muted-foreground">Achievements coming soon.</p>
    </div>
  );
}
