import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ActivityRings from "@/components/ait/ActivityRings";
import { useAitClaimQuest, useAitDashboard, useAitSpend } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Gift, ShoppingBag, TrendingUp, Flame } from "lucide-react";
import CreatorFundCard from "@/components/ait/CreatorFundCard";
import ReferralCard from "@/components/ait/ReferralCard";
import AitLeaderboard from "@/components/ait/AitLeaderboard";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function AitHub() {
  const { data, isLoading, refetch } = useAitDashboard();
  const spendMutation = useAitSpend();
  const claimMutation = useAitClaimQuest();
  const { toast } = useToast();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="loading-spinner" />
      </div>
    );
  }

  const buy = (sku: string, postId?: string) => {
    spendMutation.mutate(
      { sku, postId },
      {
        onSuccess: () => toast({ title: "Куплено! Перк активирован" }),
        onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
      },
    );
  };

  const claim = (questId: string) => {
    claimMutation.mutate(questId, {
      onError: (e: Error) =>
        toast({ title: e.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <GlassCard strong className="p-6 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-ait-orange/20 blur-3xl" />
        <div className="absolute -left-4 bottom-0 h-24 w-24 rounded-full bg-ait-purple/25 blur-2xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-ait-orange mb-1">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Валюта приключений
              </span>
            </div>
            <p className="text-4xl font-bold tabular-nums">
              {data.spendBalance.toLocaleString("ru-RU")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Spend AIT · для магазина и чаевых</p>
          </div>
          <div className="text-right">
            <Badge className="bg-ait-purple/20 text-ait-purple border-ait-purple/30 mb-2">
              {data.creatorRank.title}
            </Badge>
            <p className="text-2xl font-bold text-ait-cyan tabular-nums">
              {data.creatorBalance.toLocaleString("ru-RU")}
            </p>
            <p className="text-xs text-muted-foreground">Creator AIT · от аудитории</p>
          </div>
        </div>
        {data.streakDays > 0 && (
          <p className="relative mt-4 text-sm flex items-center gap-2 text-ait-gold">
            <Flame className="h-4 w-4" />
            Серия входов: {data.streakDays} {data.streakDays === 1 ? "день" : "дней"}
          </p>
        )}
      </GlassCard>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-ait-purple" />
          Кольца активности · сегодня
        </h2>
        <GlassCard className="p-5">
          <ActivityRings rings={data.rings} />
          {data.allRingsFull && (
            <p className="text-sm text-ait-orange text-center mt-3 font-medium">
              Все кольца закрыты — бонус +120 AIT начисляется при открытии Hub
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Общайся, публикуй, поддерживай других — закрой все кольца и забирай квесты
          </p>
        </GlassCard>
      </section>

      <AitLeaderboard />
      <ReferralCard />

      <section>
        <h2 className="text-lg font-semibold mb-3">Квесты недели</h2>
        <div className="grid gap-3">
          {data.quests.map((q) => (
            <GlassCard key={q.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{q.title}</p>
                <p className="text-sm text-muted-foreground">{q.description}</p>
                <p className="text-xs mt-1 text-ait-orange">
                  {q.progress}/{q.target} · награда {q.reward} AIT
                </p>
              </div>
              <Button
                size="sm"
                variant="premium"
                className="rounded-xl"
                disabled={q.claimed || q.progress < q.target || claimMutation.isPending}
                onClick={() => claim(q.id)}
              >
                {q.claimed ? "Получено" : "Забрать"}
              </Button>
            </GlassCard>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5" />
          Магазин AIT
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {data.catalog.map((item) => {
            const owned = data.entitlements.some((e) => e.sku === item.sku);
            return (
              <GlassCard key={item.sku} className="p-4 flex flex-col gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <Button
                  className="w-full rounded-xl"
                  variant={owned && !item.durationDays ? "secondary" : "default"}
                  disabled={
                    item.sku === "boost_post_24h" ||
                    (owned && !item.durationDays) ||
                    data.spendBalance < item.cost ||
                    spendMutation.isPending
                  }
                  onClick={() => buy(item.sku)}
                  title={
                    item.sku === "boost_post_24h"
                      ? "Купите из ленты — кнопка Boost на посте"
                      : undefined
                  }
                >
                  {item.sku === "boost_post_24h"
                    ? "В ленте"
                    : owned && !item.durationDays
                      ? "Куплено"
                      : `${item.cost} AIT`}
                </Button>
              </GlassCard>
            );
          })}
        </div>
      </section>

      <CreatorFundCard />

      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Gift className="h-5 w-5 text-ait-orange" />
          Для создателей
        </h2>
        <GlassCard className="p-5 text-sm text-muted-foreground space-y-2">
          <p>
            Публикуйте посты, stories и журналы — получайте{" "}
            <strong className="text-foreground">Creator AIT</strong> за лайки, комментарии и чаевые
            под постами.
          </p>
          <p>
            Зрители отправляют чаевые из ленты · 90% идёт автору. Ранг растёт с{" "}
            <strong className="text-foreground">{data.lifetimeCreatorEarned}</strong> lifetime
            Creator AIT.
          </p>
        </GlassCard>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">История</h2>
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Обновить
          </Button>
        </div>
        <GlassCard className="p-0 divide-y divide-white/5 max-h-80 overflow-y-auto">
          {data.ledger.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Пока пусто — начните общаться!</p>
          ) : (
            data.ledger.map((tx) => (
              <div key={tx.id} className="px-4 py-3 flex justify-between gap-2 text-sm">
                <div>
                  <p className="font-medium">{tx.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tx.createdAt), "d MMM HH:mm", { locale: ru })}
                    {tx.wallet === "creator" ? " · Creator" : ""}
                  </p>
                </div>
                <span
                  className={
                    tx.delta > 0
                      ? "text-emerald-400 font-semibold tabular-nums"
                      : "text-red-400 font-semibold tabular-nums"
                  }
                >
                  {tx.delta > 0 ? "+" : ""}
                  {tx.delta}
                </span>
              </div>
            ))
          )}
        </GlassCard>
      </section>
    </div>
  );
}
