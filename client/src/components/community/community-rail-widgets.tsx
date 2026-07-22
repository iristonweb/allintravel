import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import RightPanelWidgets, {
  type FeaturedGuideWidgetData,
  type TrendingWidgetItem,
} from "@/components/community/RightPanelWidgets";
import type { TravelPostWithAuthor } from "@shared/schema";
import { getDemoFeaturedGuide, getDemoTrends, isSocialFeedDemoMode } from "@/lib/demo-reels-feed";
import { COMMUNITY_TRAVEL_SRC } from "@/lib/marketing-images";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

function computeTrends(posts: TravelPostWithAuthor[]): TrendingWidgetItem[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    if (post.location) {
      counts.set(post.location, (counts.get(post.location) ?? 0) + 1);
    }
    for (const tag of post.tags ?? []) {
      counts.set(`#${tag}`, (counts.get(`#${tag}`) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ id: name, name, count }));
}

type CommunityRailWidgetsProps = {
  posts?: TravelPostWithAuthor[];
};

/** Data adapter: maps feed posts + API data into {@link RightPanelWidgets}. */
export function CommunityRailWidgets({ posts = [] }: CommunityRailWidgetsProps) {
  const { t, i18n } = useTranslation();
  const demoMode = isSocialFeedDemoMode();

  const trends = useMemo(() => {
    if (demoMode) return getDemoTrends();
    return computeTrends(posts);
  }, [posts, demoMode, i18n.language]);

  const { data: publicPosts = [] } = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "public", limit: "1" }],
    enabled: !demoMode,
  });
  const featuredPost = publicPosts[0];

  const featured: FeaturedGuideWidgetData | undefined = demoMode
    ? {
        ...getDemoFeaturedGuide(),
        badgeLabel: t("social.featuredNow", { defaultValue: "Featured" }),
      }
    : featuredPost
      ? {
          title:
            featuredPost.title ??
            t("social.exploreGuides", { defaultValue: "Explore travel guides" }),
          imageSrc: resolveMediaUrl(featuredPost.images?.[0]) ?? COMMUNITY_TRAVEL_SRC,
          href: `/post/${featuredPost.id}`,
          badgeLabel: t("social.featuredNow", { defaultValue: "Featured" }),
          meta: featuredPost.location ?? undefined,
        }
      : undefined;

  return (
    <RightPanelWidgets
      map={{
        title: t("social.travelMap", { defaultValue: "Travel Map" }),
        linkLabel: t("social.openMap", { defaultValue: "View map →" }),
        href: "/map",
      }}
      trends={{
        title: t("social.trending", { defaultValue: "Trends" }),
        items: trends,
        viewAllHref: "/social-feed?format=public",
        viewAllLabel: t("social.viewAllTrends", { defaultValue: "View all →" }),
      }}
      featured={featured}
    />
  );
}
