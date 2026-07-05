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

function defaultFeedMode(format: SocialContentFormat): FeedMode {
  return format === "reels" ? "all" : "following";
}

function contentFormatFromUrl(search?: string): SocialContentFormat {
  const params = new URLSearchParams(search ?? window.location.search);
  const format = formatFromQuery(params.get("format"));
  if (params.get("create") === "1" && format === "feed") return "stories";
  return format;
}

export function useSocialFeedParams(isAuthenticated: boolean) {
  const [feedMode, setFeedModeState] = useState<FeedMode>(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    if (mode) return feedModeFromQuery(mode);
    return defaultFeedMode(contentFormatFromUrl());
  });

  const [contentFormat, setContentFormatState] = useState<SocialContentFormat>(() =>
    contentFormatFromUrl(),
  );

  const [isCreating, setIsCreatingState] = useState(
    () => new URLSearchParams(window.location.search).get("create") === "1",
  );

  const replaceParams = useCallback((mutate: (params: URLSearchParams) => void) => {
    const url = new URL(window.location.href);
    mutate(url.searchParams);
    const search = url.searchParams.toString();
    window.history.replaceState({}, "", url.pathname + (search ? `?${search}` : ""));
  }, []);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const format = contentFormatFromUrl();
      setContentFormatState(format);

      if (!params.get("mode") && isAuthenticated) {
        setFeedModeState(defaultFeedMode(format));
      } else {
        setFeedModeState(feedModeFromQuery(params.get("mode")));
      }

      if (params.get("create") === "1") {
        setIsCreatingState(true);
      } else {
        setIsCreatingState(false);
      }
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, [isAuthenticated]);

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

  const setIsCreating = useCallback(
    (creating: boolean) => {
      setIsCreatingState(creating);
      replaceParams((params) => {
        if (creating) params.set("create", "1");
        else params.delete("create");
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
