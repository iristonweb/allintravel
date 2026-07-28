import type { TravelPost } from "@shared/schema";
import { registerPolicy, authorizeSync, type PolicyActor } from "./index";

registerPolicy("post.view", (actor, _action, resource) => {
  if (resource.meta?.missing) {
    return { allow: false, reason: "Post not found" };
  }
  if (resource.isPublic) return { allow: true };
  if (actor.userId && resource.ownerId && actor.userId === resource.ownerId) {
    return { allow: true };
  }
  return { allow: false, reason: "Private post" };
});

registerPolicy("post.edit", (actor, _action, resource) => {
  if (actor.isAdmin) return { allow: true };
  if (actor.userId && resource.ownerId && actor.userId === resource.ownerId) {
    return { allow: true };
  }
  return { allow: false, reason: "Not post owner" };
});

/** Adapter preserving canViewPost semantics via policy layer. */
export function canViewPostViaPolicy(
  post: TravelPost | null | undefined,
  viewerId: string | null,
): post is TravelPost {
  if (!post) {
    const deny = authorizeSync({ userId: viewerId }, "post.view", {
      type: "post",
      meta: { missing: true },
    });
    return deny.allow;
  }
  const actor: PolicyActor = { userId: viewerId };
  const decision = authorizeSync(actor, "post.view", {
    type: "post",
    id: post.id,
    ownerId: post.userId,
    isPublic: Boolean(post.isPublic),
  });
  return decision.allow;
}
