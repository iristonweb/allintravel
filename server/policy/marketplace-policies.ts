import { registerPolicy, authorizeSync } from "./index";

registerPolicy("marketplace.list", (actor, _action, resource) => {
  if (actor.userId && resource.ownerId && actor.userId === resource.ownerId) {
    return { allow: true };
  }
  return { allow: false, reason: "Only trip owner may list for sale" };
});

registerPolicy("marketplace.purchase", (actor, _action, resource) => {
  if (!actor.userId) return { allow: false, reason: "Authentication required" };
  if (resource.ownerId && actor.userId === resource.ownerId) {
    return { allow: false, reason: "Cannot purchase own route" };
  }
  if (resource.meta?.isForSale !== true) {
    return { allow: false, reason: "Not for sale" };
  }
  return { allow: true };
});

export function canListTripForSale(userId: string, ownerId: string): boolean {
  return authorizeSync({ userId }, "marketplace.list", {
    type: "trip",
    ownerId,
  }).allow;
}

export function canPurchaseTrip(buyerId: string, ownerId: string, isForSale: boolean): boolean {
  return authorizeSync({ userId: buyerId }, "marketplace.purchase", {
    type: "trip",
    ownerId,
    meta: { isForSale },
  }).allow;
}
