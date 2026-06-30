import type { Express } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { storage } from "../storage";
import { getAitDashboard, tipUser } from "../ait/service";
import { derivePlatformWalletAddress } from "./address";

const transferSchema = z.object({
  username: z.string().min(2).max(64),
  amount: z.number().int().positive(),
});

export function registerWalletRoutes(app: Express): void {
  app.get("/api/wallet", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub as string;
      const [dashboard, user] = await Promise.all([
        getAitDashboard(userId),
        storage.getUser(userId),
      ]);
      res.json({
        address: derivePlatformWalletAddress(userId),
        spendBalance: dashboard.spendBalance,
        creatorBalance: dashboard.creatorBalance,
        lifetimeSpendEarned: dashboard.lifetimeSpendEarned,
        lifetimeCreatorEarned: dashboard.lifetimeCreatorEarned,
        username: user?.username ?? null,
      });
    } catch (error) {
      console.error("GET /api/wallet", error);
      res.status(500).json({ message: "Failed to load wallet" });
    }
  });

  app.post("/api/wallet/transfer", isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub as string;
      const parsed = transferSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid transfer request" });
      }
      const username = parsed.data.username.replace(/^@/, "").toLowerCase();
      const recipient = await storage.getUserByUsername(username);
      if (!recipient) {
        return res.status(404).json({ ok: false, message: "Пользователь не найден" });
      }
      const result = await tipUser(fromUserId, recipient.id, parsed.data.amount);
      if (!result.ok) {
        return res.status(400).json({ ok: false, message: result.message ?? "Transfer failed" });
      }
      res.json({ ok: true, amount: parsed.data.amount });
    } catch (error) {
      console.error("POST /api/wallet/transfer", error);
      res.status(500).json({ message: "Transfer failed" });
    }
  });
}
