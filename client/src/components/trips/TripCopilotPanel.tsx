import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import GlassCard from "@/components/brand/glass-card";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
};

type TripCopilotPanelProps = {
  tripId: string;
  onApplied: () => void;
};

export default function TripCopilotPanel({ tripId, onApplied }: TripCopilotPanelProps) {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<CopilotResult | null>(null);
  const { toast } = useToast();

  const planMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<CopilotResult>("POST", `/api/trips/${tripId}/copilot`, { prompt }),
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: data.usedAi ? "AI Copilot готов" : "План готов",
        description: data.summary,
      });
    },
    onError: () => toast({ title: "Не удалось построить план", variant: "destructive" }),
  });

  const applyMutation = useMutation({
    mutationFn: (placeIds: string[]) =>
      apiRequestJson<{ added: number }>("POST", `/api/trips/${tripId}/copilot/apply`, {
        placeIds,
      }),
    onSuccess: (data) => {
      toast({ title: `Добавлено ${data.added} остановок` });
      setResult(null);
      setPrompt("");
      onApplied();
    },
    onError: () => toast({ title: "Не удалось применить план", variant: "destructive" }),
  });

  return (
    <GlassCard className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold">AI Trip Copilot</h3>
      </div>
      <p className="text-sm text-muted-foreground">
        Опишите поездку своими словами — мы подберём остановки в маршрут.
      </p>
      <Textarea
        placeholder="Например: 3 дня в Стамбуле, гастротур и исторический центр, без люкса"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[80px]"
      />
      <Button
        variant="premium"
        disabled={!prompt.trim() || planMutation.isPending}
        onClick={() => planMutation.mutate()}
      >
        {planMutation.isPending ? "Думаем…" : "Собрать маршрут"}
      </Button>

      {result && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          <p className="text-sm">{result.summary}</p>
          <ul className="space-y-1 text-sm max-h-48 overflow-y-auto">
            {result.suggestions.map((s) => (
              <li key={s.placeId} className="flex justify-between gap-2">
                <span>
                  <strong>{s.name}</strong> · {s.reason}
                </span>
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            disabled={applyMutation.isPending || result.suggestions.length === 0}
            onClick={() =>
              applyMutation.mutate(result.suggestions.map((s) => s.placeId))
            }
          >
            Добавить все в маршрут
          </Button>
        </div>
      )}
    </GlassCard>
  );
}
