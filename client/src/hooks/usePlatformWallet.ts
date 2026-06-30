import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import type { PlatformWalletProfile, WalletTransferResult } from "@shared/wallet";

export function usePlatformWallet(enabled = true) {
  return useQuery<PlatformWalletProfile>({
    queryKey: ["/api/wallet"],
    enabled,
  });
}

export function useWalletTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { username: string; amount: number }) => {
      const res = await apiRequest("POST", "/api/wallet/transfer", payload);
      const body = (await res.json()) as WalletTransferResult;
      if (!body.ok) {
        throw new Error(body.message ?? "Transfer failed");
      }
      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/wallet"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ait"] });
    },
  });
}

export async function fetchPlatformWallet(): Promise<PlatformWalletProfile> {
  return apiRequestJson<PlatformWalletProfile>("GET", "/api/wallet");
}
