import type { Express, Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";
import { log } from "./logger";
import { incr, MetricNames, snapshotMetrics } from "./metrics";
import { redactForLog } from "../security";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
  }
}

export function setupObservability(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = (req.headers["x-request-id"] as string) || randomUUID();
    req.requestId = requestId;
    res.setHeader("x-request-id", requestId);
    const start = Date.now();
    let capturedJsonResponse: Record<string, unknown> | undefined;

    const originalResJson = res.json.bind(res);
    res.json = function (bodyJson: unknown, ...args: unknown[]) {
      capturedJsonResponse = bodyJson as Record<string, unknown>;
      return originalResJson(bodyJson, ...(args as []));
    };

    res.on("finish", () => {
      if (!req.path.startsWith("/api")) return;
      const durationMs = Date.now() - start;
      incr(MetricNames.httpRequests);
      if (res.statusCode >= 500) incr(MetricNames.httpErrors);
      const userId =
        (req as Request & { user?: { claims?: { sub?: string }; id?: string } }).user?.claims
          ?.sub ??
        (req as Request & { user?: { id?: string } }).user?.id ??
        null;
      log.info("http.request", {
        requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        durationMs,
        userId: userId ? "[redacted-id]" : null,
        body: capturedJsonResponse ? redactForLog(capturedJsonResponse) : undefined,
      });
    });

    next();
  });

  app.get("/api/metrics", (_req, res) => {
    res.json({ ok: true, metrics: snapshotMetrics() });
  });
}
