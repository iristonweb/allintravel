import { isStoryViewed } from "@/lib/story-views";
import { coverForStoryGroup, groupStories, type StoryGroup } from "@/lib/story-groups";
import type { StoryStripItem } from "@/components/feed/StoriesStrip";
import type { TravelPostWithAuthor } from "@shared/schema";

export type { StoryGroup };
export { groupStories };

export function mapStoryGroupsToStripItems(groups: StoryGroup[]): StoryStripItem[] {
  return groups.map((group) => {
    const cover = coverForStoryGroup(group);
    const allViewed = group.posts.every((p) => isStoryViewed(p.id));
    return {
      id: group.userId,
      label: group.label,
      avatarSrc: cover ?? group.avatarUrl,
      fallback: group.label[0]?.toUpperCase() || "?",
      unviewed: !allViewed,
    };
  });
}

export function mapStoryPostsToStripItems(posts: TravelPostWithAuthor[]): StoryStripItem[] {
  return mapStoryGroupsToStripItems(groupStories(posts));
}

export function storyGroupsByUserId(groups: StoryGroup[]): Map<string, StoryGroup> {
  return new Map(groups.map((group) => [group.userId, group]));
}
