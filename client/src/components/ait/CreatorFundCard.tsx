import { useQuery } from "@tanstack/react-query";
import GlassCard from "@/components/brand/glass-card";
import { apiRequestJson } from "@/lib/queryClient";
import { CREATOR_FUND_MONTHLY_POOL } from "@shared/ait";
import { Coins } from "lucide-react";

type FundStatus = {
  monthKey: string;
  poolTotal: number;
  yourMonthCreatorEarned: number;
  estimatedShare: number;
  eligible: boolean;
  participants: number;
  creatorRank: { title: string };
  lastMonth: { monthKey: string; yourPayout: number; distributed: boolean };
};

export default function CreatorFundCard() {
  const { data } = useQuery<FundStatus>({
    queryKey: ["/api/ait/creator-fund"],
    queryFn: () => apiRequestJson("GET", "/api/ait/creator-fund"),
  });

  if (!data) return null;

  return (
    <GlassCard className="p-5 border-ait-cyan/20 bg-gradient-to-br from-ait-cyan/5 to-transparent">
      <div className="flex items-start gap-3">
        <Coins className="h-8 w-8 text-ait-cyan shrink-0" />
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-lg">Creator Fund</h3>
          <p className="text-sm text-muted-foreground">
            Каждый месяц платформа распределяет{" "}
            <strong className="text-foreground">
              {CREATOR_FUND_MONTHLY_POOL.toLocaleString("ru-RU")} AIT
            </strong>{" "}
            между авторами пропорционально Creator AIT за месяц.
          </p>
          {data.eligible ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm pt-2">
              <div className="ait-glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Ваш Creator AIT в {data.monthKey}</p>
                <p className="text-xl font-bold tabular-nums">{data.yourMonthCreatorEarned}</p>
              </div>
              <div className="ait-glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Оценка доли</p>
                <p className="text-xl font-bold text-ait-cyan tabular-nums">
                  ~{data.estimatedShare} AIT
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ait-orange">
              Наберите 500+ lifetime Creator AIT (ранг Guide), чтобы участвовать в фонде.
            </p>
          )}
          {data.lastMonth.yourPayout > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              Выплата за {data.lastMonth.monthKey}:{" "}
              <span className="text-emerald-400 font-semibold">
                +{data.lastMonth.yourPayout} AIT
              </span>
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            Участников в этом месяце: {data.participants} · ваш ранг: {data.creatorRank.title}
          </p>
        </div>
      </div>
    </GlassCard>
  );
}
