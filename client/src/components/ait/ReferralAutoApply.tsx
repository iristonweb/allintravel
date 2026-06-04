import { useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequestJson } from "@/lib/queryClient";
import {
  clearPendingReferralCode,
  getPendingReferralCode,
} from "@/lib/referral-pending";

/** Applies ?ref= code once after login */
export default function ReferralAutoApply() {
  const { isAuthenticated, isLoading } = useAuth();
  const qc = useQueryClient();
  const tried = useRef(false);

  const applyMutation = useMutation({
    mutationFn: (code: string) => apiRequestJson("POST", "/api/ait/referral/apply", { code }),
    onSettled: () => {
      clearPendingReferralCode();
      qc.invalidateQueries({ queryKey: ["/api/ait"] });
      qc.invalidateQueries({ queryKey: ["/api/ait/referral"] });
    },
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated || tried.current || applyMutation.isPending) return;
    const code = getPendingReferralCode();
    if (!code || code.length < 4) return;
    tried.current = true;
    applyMutation.mutate(code);
  }, [isAuthenticated, isLoading, applyMutation]);

  return null;
}
