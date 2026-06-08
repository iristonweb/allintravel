/** Maps authenticated user ids to open WebSocket connections for instant notifications. */

type WsLike = { readyState: number; send(data: string): void };

const OPEN = 1;
const userSockets = new Map<string, Set<WsLike>>();

export function registerUserSocket(userId: string, ws: WsLike): void {
  let set = userSockets.get(userId);
  if (!set) {
    set = new Set();
    userSockets.set(userId, set);
  }
  set.add(ws);
}

export function unregisterUserSocket(userId: string, ws: WsLike): void {
  const set = userSockets.get(userId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) userSockets.delete(userId);
}

export function broadcastToUser(userId: string, payload: Record<string, unknown>): void {
  const set = userSockets.get(userId);
  if (set?.size) {
    const data = JSON.stringify(payload);
    for (const ws of Array.from(set)) {
      if (ws.readyState === OPEN) {
        try {
          ws.send(data);
        } catch {
          set.delete(ws);
        }
      } else {
        set.delete(ws);
      }
    }
  }

  void import("./realtime/redis-pubsub")
    .then(({ enqueueUserEvent, isRedisPubSubEnabled }) => {
      if (isRedisPubSubEnabled()) {
        return enqueueUserEvent(userId, payload);
      }
    })
    .catch(() => undefined);
}

export function isUserOnline(userId: string): boolean {
  const set = userSockets.get(userId);
  return Boolean(set && set.size > 0);
}
