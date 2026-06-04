import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { resolveThemeFromSkus } from "@/lib/ait-theme";
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
  quests: (WeeklyQuestDef & { progress: number; claimed: boolean })[];
  catalog: AitCatalogItem[];
  entitlements: { sku: string; expiresAt: string | null }[];
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
      const data = await apiRequestJson<AitDashboard & { pulseGrants?: unknown[] }>("GET", "/api/ait");
      resolveThemeFromSkus(data.entitlements.map((e) => e.sku));
      return data;
    },
  });
}

export function useAitSpend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sku, postId }: { sku: string; postId?: string }) => {
      return apiRequestJson<AitDashboard>("POST", "/api/ait/spend", { sku, postId });
    },
    onSuccess: (data) => {
      qc.setQueryData(["/api/ait"], data);
      resolveThemeFromSkus(data.entitlements.map((e) => e.sku));
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
        throw e instanceof Error ? e : new Error("Не удалось отправить");
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
        throw e instanceof Error ? e : new Error("Квест недоступен");
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["/api/ait"], data);
    },
  });
}
