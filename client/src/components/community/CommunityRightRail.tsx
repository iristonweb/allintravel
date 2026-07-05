import CreatorSpotlight from "@/components/ait/CreatorSpotlight";
import AitLeaderboard from "@/components/ait/AitLeaderboard";
import SocialTeaser from "@/components/social/SocialTeaser";
import { CommunityRailWidgets } from "@/components/community/community-rail-widgets";
import type { TravelPostWithAuthor } from "@shared/schema";

type CommunityRightRailProps = {
  posts?: TravelPostWithAuthor[];
};

export default function CommunityRightRail({ posts = [] }: CommunityRightRailProps) {
  return (
    <>
      <CommunityRailWidgets posts={posts} />
      <SocialTeaser />
      <CreatorSpotlight />
      <AitLeaderboard compact />
    </>
  );
}
