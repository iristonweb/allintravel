import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { filterPostsForFeedMode, type FeedMode } from "@/lib/feed-utils";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PostFormat } from "@shared/post-formats";
import type { TravelPostWithAuthor } from "@shared/schema";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";
import {
  DEMO_STATS,
  getDemoStoryPosts,
  isSocialFeedDemoMode,
  resolveDemoPosts,
} from "@/lib/demo-reels-feed";

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
    const raw = query.data ?? [];
    const posts = resolveDemoPosts(raw, contentFormat);
    if (contentFormat === "public") return posts;
    return filterPostsForFeedMode(posts, feedMode, {
      userLat,
      userLon,
    });
  }, [query.data, feedMode, userLat, userLon, contentFormat]);

  const posts = useMemo(
    () => resolveDemoPosts(query.data ?? [], contentFormat),
    [query.data, contentFormat],
  );

  return {
    posts,
    displayedPosts,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useStoryPosts(enabled: boolean) {
  const query = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "story", limit: "24" }],
    enabled,
  });

  const data = useMemo(() => {
    const api = query.data ?? [];
    if (isSocialFeedDemoMode()) return getDemoStoryPosts();
    return api;
  }, [query.data]);

  return { ...query, data };
}

export function useReelsCount(enabled: boolean) {
  const query = useQuery<TravelPostWithAuthor[]>({
    queryKey: ["/api/posts", { format: "reel", limit: "100" }],
    enabled,
  });
  const reelsCount = useMemo(() => {
    if (isSocialFeedDemoMode()) return 89000;
    return query.data?.length ?? 0;
  }, [query.data]);
  return {
    reelsCount,
    displayReelsCount: isSocialFeedDemoMode() ? DEMO_STATS.reels : undefined,
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
  const { toast } = useToast();
  const { t } = useTranslation();

  const invalidatePosts = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
  };

  const patchPostInCaches = (
    postId: string,
    patch: (post: TravelPostWithAuthor) => TravelPostWithAuthor,
  ) => {
    const postQueries = queryClient.getQueriesData<TravelPostWithAuthor[]>({
      queryKey: ["/api/posts"],
    });
    for (const [key, data] of postQueries) {
      if (!data) continue;
      queryClient.setQueryData(
        key,
        data.map((p) => (p.id === postId ? patch(p) : p)),
      );
    }
    const singleKey = [`/api/posts/${postId}`];
    const single = queryClient.getQueryData<TravelPostWithAuthor>(singleKey);
    if (single) {
      queryClient.setQueryData(singleKey, patch(single));
    }
  };

  const createPostMutation = useMutation({
    mutationFn: (postData: {
      format: PostFormat;
      title: string;
      content: string;
      location: string;
      latitude?: string | null;
      longitude?: string | null;
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
    onMutate: async ({ postId, isLiked }) => {
      await queryClient.cancelQueries({ queryKey: ["/api/posts"] });
      const prevQueries = queryClient.getQueriesData<TravelPostWithAuthor[]>({
        queryKey: ["/api/posts"],
      });
      const prevSingle = queryClient.getQueryData<TravelPostWithAuthor>([`/api/posts/${postId}`]);
      patchPostInCaches(postId, (p) => ({
        ...p,
        isLiked: !isLiked,
        likesCount: Math.max(0, (p.likesCount ?? 0) + (isLiked ? -1 : 1)),
      }));
      return { prevQueries, prevSingle, postId };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevQueries) {
        for (const [key, data] of ctx.prevQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      if (ctx?.prevSingle !== undefined) {
        queryClient.setQueryData([`/api/posts/${ctx.postId}`], ctx.prevSingle);
      }
      toast({ title: t("social.toasts.likeFailed"), variant: "destructive" });
    },
    onSuccess: (data, { postId, isLiked }) => {
      if (!isLiked && data && (data as { created?: boolean }).created === false) {
        patchPostInCaches(postId, (p) => ({
          ...p,
          isLiked: false,
          likesCount: Math.max(0, (p.likesCount ?? 0) - 1),
        }));
      }
    },
    onSettled: invalidatePosts,
  });

  const commentMutation = useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      apiRequestJson("POST", `/api/posts/${postId}/comments`, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${variables.postId}/comments`] });
      invalidatePosts();
    },
    onError: () => {
      toast({ title: t("social.toasts.commentFailed"), variant: "destructive" });
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
    onError: () => {
      toast({ title: t("social.toasts.bookmarkFailed"), variant: "destructive" });
    },
  });

  return {
    createPostMutation,
    likePostMutation,
    commentMutation,
    toggleBookmarkMutation,
  };
}
