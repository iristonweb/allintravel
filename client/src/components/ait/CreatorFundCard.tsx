import { useQuery } from "@tanstack/react-query";
import AitSurface from "@/components/ait-ui/AitSurface";
import { apiRequestJson } from "@/lib/queryClient";
import { CREATOR_FUND_MONTHLY_POOL } from "@shared/ait";
import { Coins } from "lucide-react";
import { useTranslation, Trans } from "react-i18next";

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
  const { t, i18n } = useTranslation();
  const { data } = useQuery<FundStatus>({
    queryKey: ["/api/ait/creator-fund"],
    queryFn: () => apiRequestJson("GET", "/api/ait/creator-fund"),
  });

  if (!data) return null;

  const poolFormatted = CREATOR_FUND_MONTHLY_POOL.toLocaleString(
    i18n.language?.startsWith("ru") ? "ru-RU" : "en-US",
  );

  return (
    <AitSurface
      padding="md"
      className="border-ait-cyan/20 bg-gradient-to-br from-ait-cyan/5 to-transparent"
    >
      <div className="flex items-start gap-3">
        <Coins className="h-8 w-8 text-ait-cyan shrink-0" aria-hidden />
        <div className="space-y-2 flex-1">
          <h3 className="font-bold text-lg">{t("ait.creatorFund.title")}</h3>
          <p className="text-sm text-muted-foreground">
            <Trans
              i18nKey="ait.creatorFund.description"
              values={{ pool: poolFormatted }}
              components={{ strong: <strong className="text-foreground" /> }}
            />
          </p>
          {data.eligible ? (
            <div className="grid sm:grid-cols-2 gap-3 text-sm pt-2">
              <div className="ait-glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  {t("ait.creatorFund.yourMonth", { month: data.monthKey })}
                </p>
                <p className="text-xl font-bold tabular-nums">{data.yourMonthCreatorEarned}</p>
              </div>
              <div className="ait-glass rounded-xl p-3">
                <p className="text-xs text-muted-foreground">
                  {t("ait.creatorFund.estimatedShare")}
                </p>
                <p className="text-xl font-bold text-ait-cyan tabular-nums">
                  ~{data.estimatedShare} AIT
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ait-orange">{t("ait.creatorFund.notEligible")}</p>
          )}
          {data.lastMonth.yourPayout > 0 && (
            <p className="text-xs text-muted-foreground pt-1">
              {t("ait.creatorFund.lastPayout", { month: data.lastMonth.monthKey })}{" "}
              <span className="text-emerald-400 font-semibold">
                +{data.lastMonth.yourPayout} AIT
              </span>
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">
            {t("ait.creatorFund.participants", {
              count: data.participants,
              rank: data.creatorRank.title,
            })}
          </p>
        </div>
      </div>
    </AitSurface>
  );
}
