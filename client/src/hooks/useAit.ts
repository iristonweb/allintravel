import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequestJson } from "@/lib/queryClient";
import { resolveThemeFromSkus } from "@/lib/ait-theme";
import i18n from "@/i18n";
import type { AitCatalogItem, CreatorRankId, WeeklyQuestDef } from "@shared/ait";

export type AitDashboard = {
  spendBalance: number;
  creatorBalance: number;
  lifetimeSpendEarned: number;
  lifetimeCreatorEarned: number;
  streakDays: number;
  creatorRank: { id: CreatorRankId; title: string; minLifetimeCreator: number };
  rings: Record<string, { count: number; percent: number }>;
  allRingsFull: boolean;
  streakFreezeUsedThisMonth: number;
  streakFreezeMaxPerMonth: number;
  chatRooms: { owned: number; max: number };
  quests: (WeeklyQuestDef & { progress: number; claimed: boolean })[];
  catalog: AitCatalogItem[];
  entitlements: { sku: string; expiresAt: string | null; entityId?: string | null }[];
  ledger: {
    id: string;
    wallet: string;
    delta: number;
    reason: string;
    title: string;
    createdAt: string;
  }[];
};

export function useAitDashboard(enabled = true) {
  return useQuery<AitDashboard>({
    queryKey: ["/api/ait"],
    enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const data = await apiRequestJson<AitDashboard & { pulseGrants?: unknown[] }>(
        "GET",
        "/api/ait",
      );
      resolveThemeFromSkus(data.entitlements.map((e) => e.sku));
      return data;
    },
  });
}

export function useBoostQuote(postId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["/api/ait/boost-quote", postId],
    enabled: enabled && Boolean(postId),
    staleTime: 60_000,
    queryFn: () =>
      apiRequestJson<{
        ok: boolean;
        cost?: number;
        baseCost?: number;
        qualityScore?: number;
        verifiedExperience?: boolean;
        message?: string;
      }>("GET", `/api/ait/boost-quote?postId=${postId}`),
  });
}

export function useAitSpend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      sku,
      postId,
      roomId,
    }: {
      sku: string;
      postId?: string;
      roomId?: string;
    }) => {
      return apiRequestJson<AitDashboard>("POST", "/api/ait/spend", { sku, postId, roomId });
    },
    onSuccess: (data, variables) => {
      qc.setQueryData(["/api/ait"], data);
      resolveThemeFromSkus(data.entitlements.map((e) => e.sku));
      if (variables.sku === "boost_post_24h") {
        qc.invalidateQueries({ queryKey: ["/api/posts"] });
      }
      if (variables.sku === "room_spotlight_48h") {
        qc.invalidateQueries({ queryKey: ["/api/chat/rooms"] });
        qc.invalidateQueries({ queryKey: ["/api/chat/rooms/discover"] });
      }
    },
  });
}

export function useAitTip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, amount }: { postId: string; amount: number }) => {
      try {
        return await apiRequestJson<AitDashboard>("POST", "/api/ait/tip", { postId, amount });
      } catch (e) {
        throw e instanceof Error ? e : new Error(i18n.t("ait.tip.failed"));
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["/api/ait"], data);
    },
  });
}

export function useAitClaimQuest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (questId: string) => {
      try {
        return await apiRequestJson<AitDashboard>("POST", `/api/ait/quests/${questId}/claim`);
      } catch (e) {
        throw e instanceof Error ? e : new Error(i18n.t("ait.hub.questUnavailable"));
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["/api/ait"], data);
    },
  });
}
