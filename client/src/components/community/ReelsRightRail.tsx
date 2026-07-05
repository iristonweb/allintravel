import { CommunityRailWidgets } from "@/components/community/community-rail-widgets";
import type { TravelPostWithAuthor } from "@shared/schema";

type ReelsRightRailProps = {
  posts?: TravelPostWithAuthor[];
};

export default function ReelsRightRail({ posts = [] }: ReelsRightRailProps) {
  return <CommunityRailWidgets posts={posts} />;
}
