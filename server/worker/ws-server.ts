/**
 * Dedicated WebSocket worker for production realtime.
 * Run: npx tsx server/worker/ws-server.ts
 * Set WS_PORT (default 8081) and REDIS_URL or Upstash REST vars.
 */

import { createServer } from "http";
import { WebSocketServer } from "ws";
import { enqueueUserEvent, isRedisPubSubEnabled } from "../realtime/redis-pubsub";
import { broadcastToUser, registerUserSocket, unregisterUserSocket } from "../realtime-hub";

const PORT = Number(process.env.WS_PORT ?? 8081);

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("allintravel WS worker");
});

const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host}`);
  const userId = url.searchParams.get("userId");
  if (!userId) {
    ws.close(4001, "userId required");
    return;
  }

  registerUserSocket(userId, ws);
  ws.send(JSON.stringify({ type: "connected", userId }));

  ws.on("message", (data) => {
    try {
      const msg = JSON.parse(String(data)) as { type?: string; payload?: Record<string, unknown> };
      if (msg.type === "ping") ws.send(JSON.stringify({ type: "pong" }));
    } catch {
      /* ignore */
    }
  });

  ws.on("close", () => unregisterUserSocket(userId, ws));
});

if (isRedisPubSubEnabled()) {
  setInterval(async () => {
    const { subscribeUserEvents } = await import("../realtime/redis-pubsub");
    await subscribeUserEvents((userId, payload) => broadcastToUser(userId, payload));
  }, 1000);
}

httpServer.listen(PORT, () => {
  console.log(`[ws-worker] listening on :${PORT} redis=${isRedisPubSubEnabled()}`);
});

export { wss, enqueueUserEvent };
