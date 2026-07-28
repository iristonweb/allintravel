import {
  feedModeFromQuery,
  feedSortFromQuery,
  type FeedMode,
  type FeedSort,
} from "@/lib/feed-utils";
import { useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";

export type SocialContentFormat = "feed" | "stories" | "reels" | "journals" | "public";

const FORMATS: SocialContentFormat[] = ["feed", "stories", "reels", "journals", "public"];

export function formatFromQuery(param: string | null | undefined): SocialContentFormat {
  if (param && FORMATS.includes(param as SocialContentFormat)) {
    return param as SocialContentFormat;
  }
  return "feed";
}

function defaultFeedMode(_format: SocialContentFormat): FeedMode {
  return "all";
}

/** Parse format from a search string (`a=1` or `?a=1`). */
export function contentFormatFromSearch(search: string): SocialContentFormat {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const params = new URLSearchParams(raw);
  const format = formatFromQuery(params.get("format"));
  if (params.get("create") === "1" && format === "feed") return "stories";
  return format;
}

/**
 * Social feed URL params — single source of truth is the query string via wouter `useSearch`.
 * Sidebar Links (`?format=reels`) and in-page tabs both update the URL; this hook re-renders.
 */
export function useSocialFeedParams(isAuthenticated: boolean) {
  const [pathname, navigate] = useLocation();
  const search = useSearch();

  const params = useMemo(() => new URLSearchParams(search), [search]);

  const contentFormat = useMemo(() => contentFormatFromSearch(search), [search]);

  const feedMode = useMemo(() => {
    if (!params.get("mode") && isAuthenticated) return defaultFeedMode(contentFormat);
    return feedModeFromQuery(params.get("mode"));
  }, [params, isAuthenticated, contentFormat]);

  const isCreating = params.get("create") === "1";

  const feedSort = useMemo(() => feedSortFromQuery(params.get("sort")), [params]);

  const replaceParams = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(search);
      mutate(next);
      const qs = next.toString();
      const path =
        pathname === "/social-feed" || pathname.startsWith("/social-feed")
          ? pathname
          : "/social-feed";
      navigate(`${path}${qs ? `?${qs}` : ""}`, { replace: true });
    },
    [search, pathname, navigate],
  );

  const setFeedMode = useCallback(
    (mode: FeedMode) => {
      replaceParams((p) => {
        if (mode === "all") p.delete("mode");
        else p.set("mode", mode);
      });
    },
    [replaceParams],
  );

  const setContentFormat = useCallback(
    (format: SocialContentFormat) => {
      replaceParams((p) => {
        if (format === "feed") p.delete("format");
        else p.set("format", format);
        if (format !== "feed") p.delete("sort");
      });
    },
    [replaceParams],
  );

  const setIsCreating = useCallback(
    (creating: boolean) => {
      replaceParams((p) => {
        if (creating) p.set("create", "1");
        else p.delete("create");
      });
    },
    [replaceParams],
  );

  const setFeedSort = useCallback(
    (sort: FeedSort) => {
      replaceParams((p) => {
        if (sort === "popular") p.delete("sort");
        else p.set("sort", sort);
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
    feedSort,
    setFeedSort,
  };
}
