import type { BoostCampaignMeta } from "./campaigns";

type SortablePost = {
  id: string;
  createdAt?: Date | string | null;
  userId?: string | null;
  location?: string | null;
};

export function sortPostsWithBoostCampaigns<T extends SortablePost>(
  posts: T[],
  campaigns: Map<string, BoostCampaignMeta>,
  viewerTripDestinations: string[] = [],
): (T & { isBoosted?: boolean; promoteLabel?: string | null; boostScore?: number })[] {
  const destLower = viewerTripDestinations.map((d) => d.toLowerCase());

  const scored = posts.map((post) => {
    const campaign = campaigns.get(post.id);
    if (!campaign) {
      return { ...post, isBoosted: false, promoteLabel: null, boostScore: 0 };
    }

    let relevance = 1;
    const loc = (post.location ?? "").toLowerCase();
    if (loc && destLower.some((d) => loc.includes(d) || d.includes(loc.split(",")[0] ?? ""))) {
      relevance = 1.5;
    }

    const boostScore = campaign.qsAtLaunch * relevance;
    return {
      ...post,
      isBoosted: true,
      promoteLabel: campaign.promoteLabel,
      boostScore,
    };
  });

  return scored.sort((a, b) => {
    const ab = a.boostScore ?? 0;
    const bb = b.boostScore ?? 0;
    if (ab !== bb) return bb - ab;
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });
}
