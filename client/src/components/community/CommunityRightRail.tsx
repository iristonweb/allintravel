import { CommunityRailWidgets } from "@/components/community/community-rail-widgets";
import CreatorSpotlight from "@/components/ait/CreatorSpotlight";
import type { TravelPostWithAuthor } from "@shared/schema";

type CommunityRightRailProps = {
  posts?: TravelPostWithAuthor[];
};

/** Right rail for the community hub — map, trends, featured guide only. */
export default function CommunityRightRail({ posts = [] }: CommunityRightRailProps) {
  return (
    <div className="space-y-4">
      <CreatorSpotlight />
      <CommunityRailWidgets posts={posts} />
    </div>
  );
}
