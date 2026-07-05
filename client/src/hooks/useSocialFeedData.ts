import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { filterPostsForFeedMode, type FeedMode } from "@/lib/feed-utils";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import type { PostFormat } from "@shared/post-formats";
import type { TravelPostWithAuthor } from "@shared/schema";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";

export type PostsQueryParams = Record<string, string>;

export function buildPostsQueryParams(options: {
  contentFormat: SocialContentFormat;
  apiFormat: PostFormat | "public";
  feedMode: FeedMode;
  activeTag: string | null;
  userId?: string;
}): PostsQueryParams {
  const { contentFormat, apiFormat, feedMode, activeTag, userId } = options;
  if (contentFormat === "public") return { public: "1", limit: "30" };
  const base: PostsQueryParams = { format: apiFormat as string };
  if (activeTag) base.tag = activeTag;
  if (userId && feedMode === "following") base.following = userId;
  if (contentFormat === "reels") base.limit = "50";
  return base;
}

type UseSocialFeedPostsOptions = {
  enabled: boolean;
  postsQueryParams: PostsQueryParams;
  contentFormat: SocialContentFormat;
  feedMode: FeedMode;
  userLat?: number | null;
  userLon?: number | null;
};

export function useSocialFeedPosts({
  enabled,
  postsQueryParams,
  contentFormat,
  feedMode,
  userLat,
  userLon,
}: UseSocialFeedPostsOptions) {
  const query = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", postsQueryParams],
    enabled,
    refetchInterval: enabled ? 20_000 : false,
  });

  const displayedPosts = useMemo(() => {
    const posts = query.data ?? [];
    if (contentFormat === "public") return posts;
    return filterPostsForFeedMode(posts, feedMode, {
      userLat,
      userLon,
    });
  }, [query.data, feedMode, userLat, userLon, contentFormat]);

  return {
    posts: query.data ?? [],
    displayedPosts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStoryPosts(enabled: boolean) {
  return useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "story", limit: "24" }],
    enabled,
  });
}

export function useReelsCount(enabled: boolean) {
  const query = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "reel", limit: "100" }],
    enabled,
  });
  return {
    reelsCount: query.data?.length ?? 0,
    isLoading: query.isLoading,
  };
}

export function useBookmarks(enabled: boolean) {
  const query = useQuery<{ postIds: string[] }>({
    queryKey: ["/api/bookmarks"],
    enabled,
  });
  const bookmarkedSet = useMemo(() => new Set(query.data?.postIds ?? []), [query.data?.postIds]);
  return { bookmarkedSet, ...query };
}

export function useSocialFeedMutations(bookmarkedSet: Set<string>) {
  const queryClient = useQueryClient();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
  };

  const createPostMutation = useMutation({
    mutationFn: (postData: {
      format: PostFormat;
      title: string;
      content: string;
      location: string;
      tags: string[];
      isPublic: boolean;
      images?: string[];
    }) => apiRequestJson("POST", "/api/posts", postData),
    onSuccess: invalidatePosts,
  });

  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${postId}/like`);
        return null;
      }
      return apiRequestJson("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: invalidatePosts,
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiRequestJson("POST", `/api/posts/${postId}/comments`, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}/comments`] });
      invalidatePosts();
    },
  });

  const toggleBookmarkMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (bookmarkedSet.has(postId)) {
        await apiRequest("DELETE", `/api/bookmarks/${postId}`);
        return { postId, saved: false };
      }
      await apiRequest("POST", `/api/bookmarks/${postId}`);
      return { postId, saved: true };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/bookmarks"] }),
  });

  return {
    createPostMutation,
    likePostMutation,
    commentMutation,
    toggleBookmarkMutation,
  };
}
