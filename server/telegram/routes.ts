import type { Express, Request, Response } from "express";
import { verifyTelegramInitData } from "./verify";
import { registerPolicy, authorize } from "../policy";

registerPolicy("telegram.verify", (actor, _action, resource) => {
  if (resource.meta?.verified === true) return { allow: true };
  return { allow: false, reason: "Telegram initData not verified" };
});

export function registerTelegramRoutes(app: Express): void {
  app.post("/api/telegram/verify", async (req: Request, res: Response) => {
    const initData = String(req.body?.initData ?? "");
    const result = verifyTelegramInitData(initData);
    if (!result.ok) {
      return res.status(401).json({ ok: false, message: result.reason ?? "Unauthorized" });
    }
    const decision = await authorize({ userId: result.userId ?? null }, "telegram.verify", {
      type: "telegram",
      meta: { verified: true },
    });
    if (!decision.allow) {
      return res.status(403).json({ ok: false, message: decision.reason });
    }
    res.json({
      ok: true,
      telegramUserId: result.userId ?? null,
      username: result.username ?? null,
    });
  });
}
