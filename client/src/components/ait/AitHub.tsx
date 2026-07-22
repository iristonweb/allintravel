import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import PlatformWalletCard from "@/components/wallet/PlatformWalletCard";
import AitHubSkeleton from "@/components/ait/AitHubSkeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import ActivityRings from "@/components/ait/ActivityRings";
import { useAitClaimQuest, useAitDashboard, useAitSpend } from "@/hooks/useAit";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ShoppingBag, TrendingUp, Flame } from "lucide-react";
import CreatorSpotlight from "@/components/ait/CreatorSpotlight";
import CreatorFundCard from "@/components/ait/CreatorFundCard";
import ReferralCard from "@/components/ait/ReferralCard";
import AitLeaderboard from "@/components/ait/AitLeaderboard";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import type { Locale } from "date-fns";
import type { AitCatalogItem } from "@shared/ait";
import type { ChatRoom } from "@shared/schema";
import {
  THEME_SKU_OPTIONS,
  getActiveThemeId,
  getOwnedThemeIds,
  selectAitTheme,
} from "@/lib/ait-theme-picker";
import type { AitThemeId } from "@/lib/ait-theme";

type ShopButtonState = {
  label: string;
  disabled: boolean;
  variant: "default" | "secondary" | "glass";
  title?: string;
};

function insufficientTitle(t: TFunction, spendBalance: number, creatorBalance: number) {
  return t("ait.hub.shopInsufficient", { spend: spendBalance, creator: creatorBalance });
}

function resolveShopButton(
  item: AitCatalogItem,
  opts: {
    totalBalance: number;
    spendBalance: number;
    creatorBalance: number;
    entitlements: { sku: string; expiresAt: string | null; entityId?: string | null }[];
    streakFreezeUsed: number;
    streakFreezeMax: number;
    spendPending: boolean;
  },
  t: TFunction,
  dateLocale: Locale,
): ShopButtonState {
  const {
    totalBalance,
    spendBalance,
    creatorBalance,
    entitlements,
    streakFreezeUsed,
    streakFreezeMax,
  } = opts;

  if (item.sku === "boost_post_24h") {
    return {
      label: t("ait.hub.shopInFeed"),
      disabled: true,
      variant: "secondary",
      title: t("ait.hub.shopInFeedTitle"),
    };
  }

  if (item.purchasable === "consumable" && item.sku === "streak_freeze") {
    const atLimit = streakFreezeUsed >= streakFreezeMax;
    const canAfford = totalBalance >= item.cost;
    return {
      label: atLimit
        ? t("ait.hub.shopLimitMonth", { max: streakFreezeMax })
        : t("ait.hub.shopCost", { cost: item.cost }),
      disabled: atLimit || !canAfford || opts.spendPending,
      variant: "default",
      title: atLimit
        ? t("ait.hub.shopLimitUsed", { used: streakFreezeUsed, max: streakFreezeMax })
        : !canAfford
          ? insufficientTitle(t, spendBalance, creatorBalance)
          : undefined,
    };
  }

  if (item.purchasable === "permanent") {
    const owned = entitlements.some((e) => e.sku === item.sku);
    const canAfford = totalBalance >= item.cost;
    return {
      label: owned ? t("ait.hub.shopOwned") : t("ait.hub.shopCost", { cost: item.cost }),
      disabled: owned || !canAfford || opts.spendPending,
      variant: owned ? "secondary" : "default",
      title: owned
        ? t("ait.hub.shopAlreadyOwned")
        : !canAfford
          ? insufficientTitle(t, spendBalance, creatorBalance)
          : undefined,
    };
  }

  if (item.purchasable === "stackable") {
    const count = entitlements.filter((e) => e.sku === item.sku).length;
    const canAfford = totalBalance >= item.cost;
    return {
      label:
        count > 0
          ? t("ait.hub.shopBuyMore", { cost: item.cost })
          : t("ait.hub.shopCost", { cost: item.cost }),
      disabled: !canAfford || opts.spendPending,
      variant: "default",
      title:
        count > 0
          ? t("ait.hub.shopBoughtSlots", { count })
          : !canAfford
            ? insufficientTitle(t, spendBalance, creatorBalance)
            : undefined,
    };
  }

  if (item.sku === "room_spotlight_48h") {
    const active = entitlements.find((e) => e.sku === item.sku);
    const canAfford = totalBalance >= item.cost;
    const activeLabel =
      active?.expiresAt &&
      format(new Date(active.expiresAt), "d MMM HH:mm", { locale: dateLocale });
    const roomHint = active?.entityId ? t("ait.hub.shopLinkedGroup") : "";
    return {
      label: activeLabel
        ? t("ait.hub.shopActiveUntil", { date: activeLabel })
        : t("ait.hub.shopCost", { cost: item.cost }),
      disabled: !canAfford || opts.spendPending,
      variant: active ? "secondary" : "default",
      title: !canAfford
        ? insufficientTitle(t, spendBalance, creatorBalance)
        : active
          ? `${t("ait.hub.shopExtendHint")}${roomHint}`
          : t("ait.hub.shopSelectGroup"),
    };
  }

  if (item.purchasable === "timed") {
    const active = entitlements.find((e) => e.sku === item.sku);
    const canAfford = totalBalance >= item.cost;
    const activeLabel =
      active?.expiresAt &&
      format(new Date(active.expiresAt), "d MMM HH:mm", { locale: dateLocale });
    return {
      label: activeLabel
        ? t("ait.hub.shopActiveUntil", { date: activeLabel })
        : t("ait.hub.shopCost", { cost: item.cost }),
      disabled: !canAfford || opts.spendPending,
      variant: active ? "secondary" : "default",
      title: !canAfford
        ? insufficientTitle(t, spendBalance, creatorBalance)
        : active
          ? t("ait.hub.shopExtendHint")
          : undefined,
    };
  }

  const canAfford = totalBalance >= item.cost;
  return {
    label: t("ait.hub.shopCost", { cost: item.cost }),
    disabled: !canAfford || opts.spendPending,
    variant: "default",
    title: !canAfford ? insufficientTitle(t, spendBalance, creatorBalance) : undefined,
  };
}

export default function AitHub() {
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
  const numberLocale = i18n.language?.startsWith("ru") ? "ru-RU" : "en-US";
  const { data, isLoading, refetch } = useAitDashboard();
  const spendMutation = useAitSpend();
  const claimMutation = useAitClaimQuest();
  const { toast } = useToast();
  const { user } = useAuth();
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [activeTheme, setActiveTheme] = useState<AitThemeId>("default");

  const ownedSkus = useMemo(() => data?.entitlements.map((e) => e.sku) ?? [], [data?.entitlements]);
  const ownedThemes = useMemo(() => getOwnedThemeIds(ownedSkus), [ownedSkus]);

  useEffect(() => {
    if (data) setActiveTheme(getActiveThemeId(ownedSkus));
  }, [data, ownedSkus]);

  const { data: chatRooms = [] } = useQuery<ChatRoom[]>({
    queryKey: ["/api/chat/rooms"],
    enabled: spotlightOpen,
  });

  const ownedRooms = useMemo(
    () => chatRooms.filter((r) => r.createdBy === user?.id),
    [chatRooms, user?.id],
  );

  if (isLoading || !data) {
    return <AitHubSkeleton />;
  }

  const totalBalance = data.spendBalance + data.creatorBalance;
  const spotlightCost = data.catalog.find((c) => c.sku === "room_spotlight_48h")?.cost ?? 300;

  const buy = (sku: string, postId?: string, roomId?: string) => {
    spendMutation.mutate(
      { sku, postId, roomId },
      {
        onSuccess: () => {
          setSpotlightOpen(false);
          toast({ title: t("ait.hub.purchaseSuccess") });
        },
        onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
      },
    );
  };

  const handleBuyClick = (item: AitCatalogItem) => {
    if (item.sku === "room_spotlight_48h") {
      setSpotlightOpen(true);
      return;
    }
    buy(item.sku);
  };

  const claim = (questId: string) => {
    claimMutation.mutate(questId, {
      onError: (e: Error) =>
        toast({ title: e.message.replace(/^\d+:\s*/, ""), variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PlatformWalletCard embedded />

      <section>
        <h2 className="text-base font-semibold mb-2">{t("ait.hub.creatorDashboard")}</h2>
        <div className="space-y-4">
          <CreatorSpotlight />
          <CreatorFundCard />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <AitSurface strong className="p-5 relative overflow-hidden">
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">
                  {t("ait.hub.creatorRank")}
                </p>
                <Badge className="bg-ait-purple/20 text-ait-purple border-ait-purple/30 text-sm px-3 py-1">
                  {data.creatorRank.title}
                </Badge>
                <p className="text-xs text-muted-foreground mt-3">
                  {t("ait.hub.lifetimeCreator")}{" "}
                  <span className="text-ait-cyan font-semibold tabular-nums">
                    {data.lifetimeCreatorEarned.toLocaleString(numberLocale)}
                  </span>{" "}
                  AIT
                </p>
              </div>
              {data.streakDays > 0 ? (
                <p className="text-sm flex items-center gap-2 text-ait-gold">
                  <Flame className="h-4 w-4" />
                  {data.streakDays === 1
                    ? t("ait.hub.streakOne", { count: data.streakDays })
                    : t("ait.hub.streak", { count: data.streakDays })}
                </p>
              ) : null}
            </div>
          </AitSurface>

          <section>
            <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-ait-purple" />
              {t("ait.hub.activityRings")}
            </h2>
            <AitSurface className="p-5">
              <ActivityRings rings={data.rings} />
              {data.allRingsFull && (
                <p className="text-sm text-ait-orange text-center mt-3 font-medium">
                  {t("ait.hub.allRingsBonus")}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-4 text-center">
                {t("ait.hub.ringsHint")}
              </p>
            </AitSurface>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">{t("ait.hub.weeklyQuests")}</h2>
            <div className="grid gap-3">
              {data.quests.map((q) => (
                <AitSurface
                  key={q.id}
                  className="p-4 flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium">{q.title}</p>
                    <p className="text-sm text-muted-foreground">{q.description}</p>
                    <p className="text-xs mt-1 text-ait-orange">
                      {t("ait.hub.questProgress", {
                        progress: q.progress,
                        target: q.target,
                        reward: q.reward,
                      })}
                    </p>
                  </div>
                  <AitButton
                    size="sm"
                    variant="primary"
                    disabled={q.claimed || q.progress < q.target || claimMutation.isPending}
                    onClick={() => claim(q.id)}
                  >
                    {q.claimed ? t("ait.hub.claimed") : t("ait.hub.claim")}
                  </AitButton>
                </AitSurface>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold">{t("ait.hub.history")}</h2>
              <AitButton variant="ghost" size="sm" onClick={() => refetch()}>
                {t("ait.hub.refresh")}
              </AitButton>
            </div>
            <AitSurface className="p-0 divide-y divide-white/5 max-h-80 overflow-y-auto">
              {data.ledger.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">{t("ait.hub.ledgerEmpty")}</p>
              ) : (
                data.ledger.map((tx) => (
                  <div key={tx.id} className="px-4 py-3 flex justify-between gap-2 text-sm">
                    <div>
                      <p className="font-medium">{tx.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tx.createdAt), "d MMM HH:mm", { locale: dateLocale })}
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
            </AitSurface>
          </section>
        </div>

        <div className="space-y-6">
          <AitLeaderboard />
          <ReferralCard />

          <section>
            <h2 className="text-base font-semibold mb-2">{t("ait.themes.title")}</h2>
            <AitSurface className="p-4 flex flex-wrap gap-2">
              <AitButton
                size="sm"
                variant={activeTheme === "default" ? "primary" : "secondary"}
                onClick={() => {
                  selectAitTheme("default", ownedSkus);
                  setActiveTheme("default");
                }}
              >
                {t("ait.themes.default")}
                {activeTheme === "default" && ` · ${t("ait.themes.active")}`}
              </AitButton>
              {THEME_SKU_OPTIONS.map((opt) =>
                ownedThemes.includes(opt.themeId) ? (
                  <AitButton
                    key={opt.sku}
                    size="sm"
                    variant={activeTheme === opt.themeId ? "primary" : "secondary"}
                    onClick={() => {
                      if (selectAitTheme(opt.themeId, ownedSkus)) setActiveTheme(opt.themeId);
                    }}
                  >
                    {t(opt.labelKey)}
                    {activeTheme === opt.themeId && ` · ${t("ait.themes.active")}`}
                  </AitButton>
                ) : null,
              )}
            </AitSurface>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              {t("ait.hub.shop")}
            </h2>
            {data.chatRooms && (
              <p className="text-xs text-muted-foreground mb-2">
                {t("ait.hub.chatRooms", {
                  owned: data.chatRooms.owned,
                  max: data.chatRooms.max,
                })}
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-3">
              {t("ait.hub.balance")}{" "}
              <span className="text-foreground font-medium tabular-nums">
                {totalBalance.toLocaleString(numberLocale)} AIT
              </span>{" "}
              ({data.spendBalance} Spend + {data.creatorBalance} Creator)
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-3">
              {data.catalog.map((item) => {
                const btn = resolveShopButton(
                  item,
                  {
                    totalBalance,
                    spendBalance: data.spendBalance,
                    creatorBalance: data.creatorBalance,
                    entitlements: data.entitlements,
                    streakFreezeUsed: data.streakFreezeUsedThisMonth,
                    streakFreezeMax: data.streakFreezeMaxPerMonth,
                    spendPending: spendMutation.isPending,
                  },
                  t,
                  dateLocale,
                );
                return (
                  <AitSurface key={item.sku} className="p-4 flex flex-col gap-3">
                    <div>
                      <p className="font-semibold">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      {item.sku === "streak_freeze" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("ait.hub.streakFreezeUsed", {
                            used: data.streakFreezeUsedThisMonth,
                            max: data.streakFreezeMaxPerMonth,
                          })}
                        </p>
                      )}
                      {item.purchasable === "stackable" && item.sku === "extra_chat_room" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("ait.hub.extraSlots", {
                            count: data.entitlements.filter((e) => e.sku === item.sku).length || 0,
                          })}
                          {data.chatRooms
                            ? ` · ${t("ait.hub.chatRooms", {
                                owned: data.chatRooms.owned,
                                max: data.chatRooms.max,
                              })}`
                            : null}
                        </p>
                      )}
                      {item.purchasable === "stackable" && item.sku !== "extra_chat_room" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("ait.hub.slots", {
                            count: data.entitlements.filter((e) => e.sku === item.sku).length || 0,
                          })}
                        </p>
                      )}
                    </div>
                    <AitButton
                      className="w-full"
                      variant={btn.variant === "default" ? "primary" : btn.variant}
                      disabled={btn.disabled}
                      onClick={() => handleBuyClick(item)}
                      title={btn.title}
                    >
                      {btn.label}
                    </AitButton>
                    <p className="text-[10px] text-muted-foreground text-center tabular-nums">
                      {data.spendBalance} Spend + {data.creatorBalance} Creator
                    </p>
                  </AitSurface>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={spotlightOpen} onOpenChange={setSpotlightOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("ait.hub.spotlightTitle")}</DialogTitle>
            <DialogDescription>
              {t("ait.hub.spotlightDesc", { cost: spotlightCost })}
            </DialogDescription>
          </DialogHeader>
          {ownedRooms.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("ait.hub.noOwnedRooms")}</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {ownedRooms.map((room) => (
                <AitButton
                  key={room.id}
                  variant="secondary"
                  className="w-full justify-start"
                  disabled={spendMutation.isPending || totalBalance < spotlightCost}
                  onClick={() => buy("room_spotlight_48h", undefined, room.id)}
                >
                  {room.title}
                </AitButton>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
