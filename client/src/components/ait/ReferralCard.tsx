import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Copy, Check } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { AIT_REFERRAL_REWARD } from "@shared/ait";
import { useToast } from "@/hooks/use-toast";

export default function ReferralCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);

  const { data } = useQuery<{ code: string; invited: number }>({
    queryKey: ["/api/ait/referral"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ait/referral");
      return res.json();
    },
  });

  const applyMutation = useMutation({
    mutationFn: (code: string) => apiRequestJson("POST", "/api/ait/referral/apply", { code }),
    onSuccess: () => {
      toast({ title: `+${AIT_REFERRAL_REWARD} AIT` });
      setCodeInput("");
      qc.invalidateQueries({ queryKey: ["/api/ait"] });
      qc.invalidateQueries({ queryKey: ["/api/ait/referral"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const copyCode = () => {
    if (!data?.code) return;
    void navigator.clipboard.writeText(data.code);
    setCopied(true);
    toast({ title: "Код скопирован" });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return null;

  return (
    <GlassCard className="p-5 border-ait-purple/20">
      <div className="flex items-start gap-3">
        <Users className="h-8 w-8 text-ait-purple shrink-0" />
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="font-bold text-lg">Пригласи друга</h3>
            <p className="text-sm text-muted-foreground">
              Вы и друг получаете по <strong>{AIT_REFERRAL_REWARD} Spend AIT</strong> после ввода кода.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <code className="ait-glass px-3 py-2 rounded-xl font-mono text-lg tracking-widest">
              {data.code}
            </code>
            <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={copyCode}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <span className="text-xs text-muted-foreground">Приглашено: {data.invited}</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Код друга"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              className="ait-glass rounded-xl max-w-[200px]"
            />
            <Button
              className="ait-btn-glow text-white rounded-xl"
              disabled={codeInput.length < 4 || applyMutation.isPending}
              onClick={() => applyMutation.mutate(codeInput)}
            >
              Применить
            </Button>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
