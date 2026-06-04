import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Trophy } from "lucide-react";
import GlassCard from "@/components/brand/glass-card";
import CreatorAvatar from "@/components/ait/CreatorAvatar";
import { apiRequest } from "@/lib/queryClient";

type Entry = {
  userId: string;
  earned: number;
  rank: number;
  displayName: string;
  profileImageUrl: string | null;
  username: string | null;
};

export default function AitLeaderboard({ compact = false }: { compact?: boolean }) {
  const { data } = useQuery<{ entries: Entry[] }>({
    queryKey: ["/api/ait/leaderboard", { limit: compact ? 5 : 10 }],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/ait/leaderboard?limit=${compact ? 5 : 10}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  if (!data?.entries?.length) return null;

  return (
    <GlassCard className="p-4 border-ait-gold/20">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="h-5 w-5 text-ait-gold" />
        <h3 className="font-semibold text-sm">Топ Creator AIT · неделя</h3>
      </div>
      <ul className="space-y-2">
        {data.entries.map((e) => (
          <li key={e.userId} className="flex items-center gap-3 text-sm">
            <span className="w-6 text-center font-bold text-ait-orange tabular-nums">{e.rank}</span>
            <CreatorAvatar
              src={e.profileImageUrl}
              fallback={e.displayName[0] ?? "?"}
              className="h-8 w-8"
            />
            <div className="flex-1 min-w-0">
              {e.username ? (
                <Link href={`/u/${e.username}`} className="font-medium hover:text-ait-orange truncate block">
                  {e.displayName}
                </Link>
              ) : (
                <span className="font-medium truncate block">{e.displayName}</span>
              )}
            </div>
            <span className="text-ait-cyan font-semibold tabular-nums shrink-0">{e.earned}</span>
          </li>
        ))}
      </ul>
      {!compact && (
        <Link href="/wallet" className="text-xs text-ait-orange hover:underline mt-3 inline-block">
          AIT Hub →
        </Link>
      )}
    </GlassCard>
  );
}
