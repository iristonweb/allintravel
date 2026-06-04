import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import GlassCard from "@/components/brand/glass-card";
import { Route } from "lucide-react";

type TripRouteMatchesProps = {
  tripId: string;
  className?: string;
};

export default function TripRouteMatches({ tripId, className }: TripRouteMatchesProps) {
  const { data, isLoading } = useQuery<{
    matches: { tripId: string; title: string; destination: string; overlapPercent: number }[];
  }>({
    queryKey: ["/api/trips", tripId, "route-matches"],
    enabled: !!tripId,
  });

  const matches = data?.matches ?? [];
  if (isLoading || matches.length === 0) return null;

  return (
    <GlassCard className={className ?? "p-4 mb-6"}>
      <div className="flex items-center gap-2 mb-3">
        <Route className="h-4 w-4 text-ait-purple" />
        <h3 className="font-semibold text-sm">Похожие маршруты</h3>
      </div>
      <ul className="space-y-2">
        {matches.slice(0, 5).map((m) => (
          <li key={m.tripId} className="flex items-center justify-between text-sm">
            <div>
              <Link href={`/trips/${m.tripId}`} className="font-medium hover:underline">
                {m.title}
              </Link>
              <span className="text-muted-foreground text-xs ml-2">{m.destination}</span>
            </div>
            <span className="text-ait-purple font-semibold">{m.overlapPercent}%</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}
