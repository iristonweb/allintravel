/** Fail-closed object authorization policy layer. */

export type PolicyActor = {
  userId: string | null;
  isAdmin?: boolean;
};

export type PolicyAction =
  | "post.view"
  | "post.edit"
  | "chat.room.read"
  | "trip.manage"
  | "marketplace.purchase"
  | "marketplace.list"
  | "ai.propose"
  | "ai.apply"
  | "telegram.verify";

export type PolicyResource = {
  type: string;
  id?: string;
  ownerId?: string | null;
  isPublic?: boolean;
  meta?: Record<string, unknown>;
};

export type PolicyDecision = { allow: true } | { allow: false; reason: string };

export type PolicyHandler = (
  actor: PolicyActor,
  action: PolicyAction,
  resource: PolicyResource,
) => PolicyDecision | Promise<PolicyDecision>;

const handlers = new Map<PolicyAction, PolicyHandler>();

export function registerPolicy(action: PolicyAction, handler: PolicyHandler): void {
  handlers.set(action, handler);
}

/** Default deny when no handler is registered. */
export async function authorize(
  actor: PolicyActor,
  action: PolicyAction,
  resource: PolicyResource,
): Promise<PolicyDecision> {
  const handler = handlers.get(action);
  if (!handler) {
    return { allow: false, reason: `No policy registered for ${action}` };
  }
  return handler(actor, action, resource);
}

export function authorizeSync(
  actor: PolicyActor,
  action: PolicyAction,
  resource: PolicyResource,
): PolicyDecision {
  const handler = handlers.get(action);
  if (!handler) {
    return { allow: false, reason: `No policy registered for ${action}` };
  }
  const result = handler(actor, action, resource);
  if (result instanceof Promise) {
    throw new Error(`Policy ${action} is async; use authorize()`);
  }
  return result;
}
