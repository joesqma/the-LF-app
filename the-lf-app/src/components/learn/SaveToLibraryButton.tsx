"use client";

import { Bookmark } from "lucide-react";
import { useState } from "react";
import { removeBookmark, saveBookmark } from "~/lib/actions/bookmarks";
import { cn } from "~/lib/utils";

interface Props {
  videoUrl: string;
  title: string;
  source: string;
  topicTag?: string;
  methodTag?: string;
  isBookmarked: boolean;
}

export function SaveToLibraryButton({
  videoUrl,
  title,
  source,
  topicTag,
  methodTag,
  isBookmarked: initialIsBookmarked,
}: Props) {
  const [saved, setSaved] = useState(initialIsBookmarked);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    const prev = saved;
    setSaved(!prev); // optimistic
    setLoading(true);
    const result = prev
      ? await removeBookmark(videoUrl)
      : await saveBookmark({ videoUrl, title, source, topicTag, methodTag });
    if ("error" in result) setSaved(prev); // revert
    setLoading(false);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={saved ? "Remove from library" : "Save to library"}
      className={cn(
        "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors disabled:opacity-50",
        saved
          ? "text-orange-400 hover:text-orange-500"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Bookmark className={cn("h-3.5 w-3.5", saved && "fill-current")} />
      {saved ? "Saved" : "Save to library"}
    </button>
  );
}
