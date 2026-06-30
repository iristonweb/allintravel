import type { Express, Request, Response } from "express";
import { z } from "zod";
import { insertPostCommentSchema, updateTravelPostSchema } from "@shared/schema";
import { isAuthenticated } from "../../auth";
import type { IStorage } from "../../storage";
import { parseCreateTravelPostBody } from "../../post-validation";
import {
  grantForPostCommented,
  grantForPostCreated,
  grantForPostLiked,
  type AitGrantResult,
} from "../../ait/hooks";
import {
  notifyPostCommented,
  notifyPostLiked,
  syncPostLikeNotification,
} from "../../notification-service";
import { getUsersWithCreatorBadge } from "../../ait/perks";
import { getActiveBoostCampaigns } from "../../ait/boost/campaigns";
import { sortPostsWithBoostCampaigns } from "../../ait/boost/feed-sort";

export function registerPostsRoutes(app: Express, storage: IStorage): void {
  app.post("/api/posts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const postData = parseCreateTravelPostBody(req.body, userId);
      const post = await storage.createTravelPost(postData);
      const aitGrant = await grantForPostCreated(
        userId,
        post.format ?? "post",
        post.content,
        post.images,
        post.id,
      );
      res.status(201).json({ ...post, aitGrant: aitGrant ?? null });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get("/api/posts", async (req: Request, res: Response) => {
    try {
      const {
        userId,
        following,
        tag,
        format,
        public: publicFilter,
        limit = 20,
        offset = 0,
      } = req.query;
      const currentUserId: string | null =
        (req as Request & { user?: { claims?: { sub: string } } }).user?.claims?.sub ?? null;
      const posts = await storage.getTravelPosts({
        userId: userId as string,
        following: following as string,
        tag: tag as string,
        format: format as string | undefined,
        publicOnly: publicFilter === "1" || publicFilter === "true",
        limit: Number(limit),
        offset: Number(offset),
      });
      const campaigns = await getActiveBoostCampaigns();
      const enriched = await Promise.all(
        posts.map(async (post) => {
          const author = post.userId ? await storage.getUser(post.userId) : null;
          const likesCount = await storage.getPostLikesCount(post.id);
          const commentsCount = await storage.getPostCommentsCount(post.id);
          const isLiked = currentUserId
            ? await storage.isPostLikedByUser(currentUserId, post.id)
            : false;
          const campaign = campaigns.get(post.id);
          return {
            ...post,
            author: author
              ? {
                  id: author.id,
                  firstName: author.firstName,
                  lastName: author.lastName,
                  profileImageUrl: author.profileImageUrl,
                }
              : null,
            likesCount,
            commentsCount,
            isLiked,
            isBoosted: Boolean(campaign),
            promoteLabel: campaign?.promoteLabel ?? null,
          };
        }),
      );
      const authorIds = enriched.map((p) => p.userId).filter(Boolean) as string[];
      const badges = await getUsersWithCreatorBadge(authorIds);
      const withBadges = enriched.map((p) => ({
        ...p,
        creatorBadge: p.userId ? badges.has(p.userId) : false,
      }));

      let viewerDestinations: string[] = [];
      if (currentUserId) {
        const trips = await storage.getTrips({ userId: currentUserId, limit: 10 });
        viewerDestinations = trips.map((t) => t.destination);
      }

      const sorted = sortPostsWithBoostCampaigns(withBadges, campaigns, viewerDestinations);

      for (const p of sorted) {
        if (p.isBoosted) {
          void import("../../ait/boost/campaigns").then((m) => m.incrementBoostImpression(p.id));
        }
      }

      res.json(sorted);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  app.get("/api/posts/:id", async (req: Request, res: Response) => {
    try {
      const post = await storage.getTravelPost(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const currentUserId: string | null =
        (req as Request & { user?: { claims?: { sub: string } } }).user?.claims?.sub ?? null;
      if (!post.isPublic && post.userId !== currentUserId) {
        return res.status(404).json({ message: "Post not found" });
      }
      const author = post.userId ? await storage.getUser(post.userId) : null;
      const likesCount = await storage.getPostLikesCount(post.id);
      const commentsCount = await storage.getPostCommentsCount(post.id);
      const isLiked = currentUserId
        ? await storage.isPostLikedByUser(currentUserId, post.id)
        : false;
      const campaigns = await getActiveBoostCampaigns();
      const campaign = campaigns.get(post.id);
      res.json({
        ...post,
        author: author
          ? {
              id: author.id,
              firstName: author.firstName,
              lastName: author.lastName,
              profileImageUrl: author.profileImageUrl,
            }
          : null,
        likesCount,
        commentsCount,
        isLiked,
        isBoosted: Boolean(campaign),
        promoteLabel: campaign?.promoteLabel ?? null,
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts/:id/boost-click", async (req: Request, res: Response) => {
    try {
      const { incrementBoostClick } = await import("../../ait/boost/campaigns");
      await incrementBoostClick(req.params.id);
      res.json({ ok: true });
    } catch (error) {
      console.error("Error recording boost click:", error);
      res.status(500).json({ message: "Failed to record click" });
    }
  });

  app.put("/api/posts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const existing = await storage.getTravelPost(req.params.id);
      if (!existing) return res.status(404).json({ message: "Post not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      const postData = updateTravelPostSchema.parse(req.body);
      const post = await storage.updateTravelPost(req.params.id, postData);
      res.json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error("Error updating post:", error);
      res.status(500).json({ message: "Failed to update post" });
    }
  });

  app.delete("/api/posts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const existing = await storage.getTravelPost(req.params.id);
      if (!existing) return res.status(404).json({ message: "Post not found" });
      if (existing.userId !== userId) return res.status(403).json({ message: "Forbidden" });
      await storage.deleteTravelPost(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/posts/:id/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getTravelPost(postId);
      const like = await storage.likePost(userId, postId);
      let aitGrant: AitGrantResult | null = null;
      if (post?.userId) {
        const g = await grantForPostLiked(userId, post.userId, postId);
        aitGrant = g.authorGrant;
        const liker = await storage.getUser(userId);
        if (liker && post.content) {
          void notifyPostLiked(post.userId, liker, postId, post.content).catch((err) =>
            console.error("[notify] post like:", err),
          );
        }
      }
      res.status(201).json({ ...like, aitGrant });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getTravelPost(postId);
      await storage.unlikePost(userId, postId);
      if (post?.userId && post.content) {
        void syncPostLikeNotification(post.userId, postId, post.content).catch((err) =>
          console.error("[notify] post unlike sync:", err),
        );
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post("/api/posts/:id/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as Request & { user: { claims: { sub: string } } }).user.claims.sub;
      const postId = req.params.id;
      const post = await storage.getTravelPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      const commentData = insertPostCommentSchema.parse({ ...req.body, userId, postId });
      const comment = await storage.addPostComment(commentData);
      let aitGrant: AitGrantResult | null = null;
      if (post.userId) {
        const g = await grantForPostCommented(userId, post.userId, postId, comment.content);
        aitGrant = g.commenterGrant;
        const commenter = await storage.getUser(userId);
        if (commenter) {
          void notifyPostCommented(
            post.userId,
            commenter,
            postId,
            post.content ?? "",
            comment.content,
          ).catch((err) => console.error("[notify] post comment:", err));
        }
      }
      res.status(201).json({ ...comment, aitGrant });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get("/api/posts/:id/comments", async (req: Request, res: Response) => {
    try {
      const comments = await storage.getPostComments(req.params.id);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
}
