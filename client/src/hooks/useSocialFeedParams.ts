import { feedModeFromQuery, type FeedMode } from "@/lib/feed-utils";
import { useCallback, useEffect, useState } from "react";

export type SocialContentFormat = "feed" | "stories" | "reels" | "journals" | "public";

const FORMATS: SocialContentFormat[] = ["feed", "stories", "reels", "journals", "public"];

function formatFromQuery(param: string | null): SocialContentFormat {
  if (param && FORMATS.includes(param as SocialContentFormat)) {
    return param as SocialContentFormat;
  }
  return "feed";
}

export function useSocialFeedParams(isAuthenticated: boolean) {
  const [feedMode, setFeedModeState] = useState<FeedMode>(() =>
    feedModeFromQuery(new URLSearchParams(window.location.search).get("mode")),
  );

  const [contentFormat, setContentFormatState] = useState<SocialContentFormat>(() =>
    formatFromQuery(new URLSearchParams(window.location.search).get("format")),
  );

  const [isCreating, setIsCreating] = useState(
    () => new URLSearchParams(window.location.search).get("create") === "1",
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("mode") && isAuthenticated) {
      setFeedModeState("following");
    } else {
      setFeedModeState(feedModeFromQuery(params.get("mode")));
    }
    setContentFormatState(formatFromQuery(params.get("format")));
    if (params.get("create") === "1") {
      setContentFormatState("stories");
      setIsCreating(true);
    }
  }, [isAuthenticated]);

  const replaceParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    const url = new URL(window.location.href);
    mutate(url.searchParams);
    window.history.replaceState({}, "", url.pathname + url.search);
  }, []);

  const setFeedMode = useCallback(
    (mode: FeedMode) => {
      setFeedModeState(mode);
      replaceParams((params) => {
        if (mode === "all") params.delete("mode");
        else params.set("mode", mode);
      });
    },
    [replaceParams],
  );

  const setContentFormat = useCallback(
    (format: SocialContentFormat) => {
      setContentFormatState(format);
      replaceParams((params) => {
        if (format === "feed") params.delete("format");
        else params.set("format", format);
      });
    },
    [replaceParams],
  );

  return {
    feedMode,
    setFeedMode,
    contentFormat,
    setContentFormat,
    isCreating,
    setIsCreating,
  };
}
