"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "~/lib/supabase/client";
import type { UserProfile } from "~/types/database";

interface UseUserResult {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

// Module-level registry of refetch functions. Every mounted useUser instance
// registers itself here. Calling triggerProfileRefetch() hits all of them
// directly — no window events, no stale closures, no race conditions.
const profileRefetchers = new Set<() => void>();

export function triggerProfileRefetch() {
  for (const fn of profileRefetchers) fn();
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser) return;
    const { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", currentUser.id)
      .single();
    setProfile(data);
  }, []);

  // Register this instance's refetcher so triggerProfileRefetch() can reach it
  useEffect(() => {
    profileRefetchers.add(refetchProfile);
    return () => {
      profileRefetchers.delete(refetchProfile);
    };
  }, [refetchProfile]);

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single();
        setProfile(data);
      }
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        const { data } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", nextUser.id)
          .single();
        setProfile(data);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
