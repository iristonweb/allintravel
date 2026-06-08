import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GlassCard from "@/components/brand/glass-card";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Suggestion = {
  placeId: string;
  name: string;
  type: string;
  reason: string;
};

type CopilotResult = {
  summary: string;
  suggestions: Suggestion[];
  usedAi: boolean;
  messages?: { role: string; content: string }[];
};

type CompanionMatch = {
  userId: string;
  username: string | null;
  displayName: string | null;
  profileImageUrl: string | null;
  compatibilityScore: number;
};

type TripCopilotPanelProps = {
  tripId: string;
  onApplied: () => void;
};

export default function TripCopilotPanel({ tripId, onApplied }: TripCopilotPanelProps) {
  const { t } = useTranslation();
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<CopilotResult | null>(null);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const { toast } = useToast();

  const { data: matchesData } = useQuery<{ matches: CompanionMatch[] }>({
    queryKey: [`/api/trips/${tripId}/companion-matches`],
  });

  const planMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<CopilotResult>("POST", `/api/trips/${tripId}/copilot/chat`, { prompt }),
    onSuccess: (data) => {
      setResult(data);
      setHistory(data.messages ?? []);
      setPrompt("");
      toast({
        title: data.usedAi ? t("ai.agentTitle") : t("common.save"),
        description: data.summary,
      });
    },
    onError: () => toast({ title: t("common.retry"), variant: "destructive" }),
  });

  const legacyPlanMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<CopilotResult>("POST", `/api/trips/${tripId}/copilot`, { prompt }),
    onSuccess: (data) => {
      setResult(data);
      toast({ title: data.summary });
    },
  });

  const applyMutation = useMutation({
    mutationFn: (placeIds: string[]) =>
      apiRequestJson<{ added: number }>("POST", `/api/trips/${tripId}/copilot/apply`, {
        placeIds,
      }),
    onSuccess: (data) => {
      toast({ title: `+${data.added}` });
      setResult(null);
      setPrompt("");
      onApplied();
    },
  });

  return (
    <div className="space-y-4">
      <GlassCard className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-semibold">{t("ai.agentTitle")}</h3>
        </div>

        {history.length > 0 && (
          <div className="max-h-40 overflow-y-auto space-y-2 text-sm border border-white/10 rounded-xl p-3">
            {history.slice(-6).map((m, i) => (
              <p key={i} className={m.role === "user" ? "text-white" : "text-muted-foreground"}>
                <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
              </p>
            ))}
          </div>
        )}

        <Textarea
          placeholder={t("ai.askAnything")}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="min-h-[80px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (prompt.trim()) planMutation.mutate();
            }
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="premium"
            disabled={!prompt.trim() || planMutation.isPending}
            onClick={() => planMutation.mutate()}
          >
            {planMutation.isPending ? "…" : t("ai.agentTitle")}
          </Button>
          <Button
            variant="outline"
            disabled={!prompt.trim() || legacyPlanMutation.isPending}
            onClick={() => legacyPlanMutation.mutate()}
          >
            Quick plan
          </Button>
        </div>

        {result && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <p className="text-sm">{result.summary}</p>
            <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
              {result.suggestions.map((s) => (
                <li key={s.placeId}>
                  <strong>{s.name}</strong> · {s.reason}
                </li>
              ))}
            </ul>
            <Button
              variant="outline"
              disabled={applyMutation.isPending || result.suggestions.length === 0}
              onClick={() => applyMutation.mutate(result.suggestions.map((s) => s.placeId))}
            >
              Apply to route
            </Button>
          </div>
        )}
      </GlassCard>

      {(matchesData?.matches?.length ?? 0) > 0 && (
        <GlassCard className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#ff7a18]" />
            <h3 className="font-semibold">{t("ai.companionMatch")}</h3>
          </div>
          <ul className="space-y-2">
            {matchesData!.matches.slice(0, 4).map((m) => (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/5 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={m.profileImageUrl ?? undefined} />
                    <AvatarFallback>{(m.displayName ?? "?")[0]}</AvatarFallback>
                  </Avatar>
                  {m.username ? (
                    <Link href={`/u/${m.username}`} className="text-sm font-medium truncate hover:underline">
                      @{m.username}
                    </Link>
                  ) : (
                    <span className="text-sm truncate">{m.displayName}</span>
                  )}
                </div>
                <span className="text-xs font-semibold text-[#a78bfa] shrink-0">
                  {m.compatibilityScore}% {t("ai.matchScore")}
                </span>
              </li>
            ))}
          </ul>
        </GlassCard>
      )}
    </div>
  );
}
