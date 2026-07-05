import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";
import { apiRequestJson } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type AiContextResponse = {
  surface: string;
  suggestion: string;
  actions: { label: string; href: string }[];
};

type AiContextChipsProps = {
  surface: "map" | "social" | "passport" | "home" | "trip";
  query?: string;
  tripId?: string;
  lat?: number;
  lon?: number;
  className?: string;
  compact?: boolean;
};

export default function AiContextChips({
  surface,
  query,
  tripId,
  lat,
  lon,
  className,
  compact,
}: AiContextChipsProps) {
  const { data, isLoading } = useQuery<AiContextResponse>({
    queryKey: ["/api/ai/context", surface, query, tripId, lat, lon],
    queryFn: () =>
      apiRequestJson<AiContextResponse>("POST", "/api/ai/context", {
        surface,
        query: query ?? "",
        tripId,
        lat,
        lon,
      }),
    staleTime: 60_000,
  });

  if (isLoading && !data) return null;
  if (!data?.actions?.length) return null;

  return (
    <div
      className={cn(
        "ait-glass rounded-2xl border border-white/10 px-3 py-2 space-y-2",
        className,
      )}
    >
      {!compact && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3 w-3 text-ait-purple shrink-0" />
          {data.suggestion}
        </p>
      )}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {data.actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="shrink-0 h-8 px-3 rounded-full text-xs font-medium ait-glass border border-white/10 hover:border-ait-purple/40 hover:text-ait-orange transition-colors inline-flex items-center"
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
