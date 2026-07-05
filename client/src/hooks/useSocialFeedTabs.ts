import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { type FeedMode } from "@/lib/feed-utils";
import { useFilterLabels } from "@/hooks/useFilterLabels";
import {
  useSocialFeedParams,
  type SocialContentFormat,
} from "@/hooks/useSocialFeedParams";

type UseSocialFeedTabsOptions = {
  isAuthenticated: boolean;
  onFormatChange?: (format: SocialContentFormat) => void;
  onFeedModeChange?: (mode: FeedMode) => void;
};

export function useSocialFeedTabs({
  isAuthenticated,
  onFormatChange,
  onFeedModeChange,
}: UseSocialFeedTabsOptions) {
  const { t } = useTranslation();
  const filters = useFilterLabels();
  const {
    feedMode,
    setFeedMode: setFeedModeParam,
    contentFormat,
    setContentFormat: setContentFormatParam,
    isCreating,
    setIsCreating,
  } = useSocialFeedParams(isAuthenticated);

  const reelsFilterPills = useMemo(
    () => [
      { id: "all" as FeedMode, label: t("social.reelsFilters.forYou", { defaultValue: "For you" }) },
      { id: "popular" as FeedMode, label: t("filters.feedMode.popular") },
      { id: "following" as FeedMode, label: t("filters.feedMode.following") },
      { id: "nearby" as FeedMode, label: t("filters.feedMode.nearby") },
      { id: "trending" as FeedMode, label: t("filters.feedMode.trending", { defaultValue: "Trending" }) },
    ],
    [t],
  );

  const feedModeTabs = useMemo(
    () => filters.feedModeTabs.map(({ value, label }) => ({ id: value as FeedMode, label })),
    [filters.feedModeTabs],
  );

  const showFeedModeTabs =
    contentFormat === "feed" || contentFormat === "journals" || contentFormat === "public";

  const showReelsFilterPills = contentFormat === "reels";

  const showComposer = contentFormat !== "public" && (contentFormat !== "reels" || isCreating);

  const setContentFormat = useCallback(
    (format: SocialContentFormat) => {
      setContentFormatParam(format);
      if (format === "reels" && feedMode !== "all" && !new URLSearchParams(window.location.search).get("mode")) {
        setFeedModeParam("all");
      }
      if (format !== "reels" && isCreating && format !== "stories") {
        setIsCreating(false);
      }
      onFormatChange?.(format);
    },
    [setContentFormatParam, feedMode, setFeedModeParam, isCreating, setIsCreating, onFormatChange],
  );

  const setFeedMode = useCallback(
    (mode: FeedMode) => {
      setFeedModeParam(mode);
      onFeedModeChange?.(mode);
    },
    [setFeedModeParam, onFeedModeChange],
  );

  const createHref =
    contentFormat === "reels"
      ? "/social-feed?format=reels&create=1"
      : contentFormat === "stories"
        ? "/social-feed?format=stories&create=1"
        : "/social-feed?create=1";

  return {
    feedMode,
    setFeedMode,
    contentFormat,
    setContentFormat,
    isCreating,
    setIsCreating,
    reelsFilterPills,
    feedModeTabs,
    showFeedModeTabs,
    showReelsFilterPills,
    showComposer,
    createHref,
  };
}
