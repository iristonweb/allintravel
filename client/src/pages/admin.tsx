import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Button } from "@/components/ui/button";
import SmartSearchField from "@/components/search/SmartSearchField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminBroadcastDialog from "@/components/admin/AdminBroadcastDialog";
import MessageComposer from "@/components/chat/MessageComposer";
import EmptyState from "@/components/empty-state";
import { Shield, Coins, Bell, Megaphone, AlertCircle, Loader2, Flag } from "lucide-react";
import { format } from "date-fns";
import { enUS, ru } from "date-fns/locale";
import { useTranslation } from "react-i18next";

type SearchUser = {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  spendBalance: number;
  creatorBalance: number;
};

type UserAitDetail = {
  user: SearchUser & { email: string };
  ait: {
    spendBalance: number;
    creatorBalance: number;
    lifetimeSpendEarned: number;
    lifetimeCreatorEarned: number;
    creatorRank: { title: string };
    entitlements: { sku: string; expiresAt: string | null; entityId: string | null }[];
    ledger: {
      id: string;
      wallet: string;
      delta: number;
      title: string;
      reason: string;
      createdAt: string;
    }[];
  };
};

export default function AdminPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language?.startsWith("ru") ? ru : enUS;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [searchQ, setSearchQ] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<"spend" | "creator">("spend");
  const [delta, setDelta] = useState("");
  const [note, setNote] = useState("");
  const [sendPush, setSendPush] = useState(true);
  const [pushTitle, setPushTitle] = useState("All In Travel");
  const [pushBody, setPushBody] = useState("");

  const isAdmin = !!user?.isAdmin;

  const {
    data: searchResults,
    isFetching: searchFetching,
    isError: searchError,
    refetch: refetchSearch,
  } = useQuery<{ users: SearchUser[] }>({
    queryKey: ["/api/admin/ait/search", searchQ],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ait/search?q=${encodeURIComponent(searchQ)}`);
      return res.json();
    },
    enabled: isAdmin && searchQ.trim().length >= 2,
  });

  const {
    data: userDetail,
    refetch: refetchUser,
    isLoading: userDetailLoading,
    isError: userDetailError,
  } = useQuery<UserAitDetail>({
    queryKey: ["/api/admin/ait/users", selectedId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ait/users/${selectedId}`);
      return res.json();
    },
    enabled: isAdmin && !!selectedId,
  });

  const {
    data: globalTx,
    isLoading: globalTxLoading,
    isError: globalTxError,
    refetch: refetchGlobalTx,
  } = useQuery<{
    transactions: {
      id: string;
      userId: string;
      userLabel: string;
      username: string | null;
      wallet: string;
      delta: number;
      title: string;
      reasonCode: string;
      createdAt: string;
    }[];
  }>({
    queryKey: ["/api/admin/ait/transactions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ait/transactions?limit=50");
      return res.json();
    },
    enabled: isAdmin,
  });

  const { data: fraudData, refetch: refetchFraud } = useQuery<{
    flags: { userId: string; level: number; reason: string | null }[];
  }>({
    queryKey: ["/api/admin/ait/fraud"],
    queryFn: () => apiRequestJson("GET", "/api/admin/ait/fraud"),
    enabled: isAdmin,
  });

  const { data: flagsData, refetch: refetchFlags } = useQuery<{
    flags: { key: string; enabled: boolean }[];
  }>({
    queryKey: ["/api/admin/flags"],
    queryFn: () => apiRequestJson("GET", "/api/admin/flags"),
    enabled: isAdmin,
  });

  const flagMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      apiRequestJson("PUT", `/api/admin/flags/${key}`, { enabled }),
    onSuccess: () => {
      toast({ title: t("admin.flagUpdated", { defaultValue: "Flag updated" }) });
      refetchFlags();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const clearFraudMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequestJson("POST", "/api/admin/ait/fraud", {
        userId,
        level: 0,
        reason: "cleared by admin",
      }),
    onSuccess: () => {
      toast({ title: t("admin.fraudCleared", { defaultValue: "Fraud flag cleared" }) });
      refetchFraud();
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const adjustMutation = useMutation({
    mutationFn: () =>
      apiRequestJson("POST", "/api/admin/ait/adjust", {
        userId: selectedId,
        wallet,
        delta: Number(delta),
        note: note.trim() || undefined,
        sendPush,
      }),
    onSuccess: () => {
      toast({ title: t("admin.balanceUpdated") });
      setDelta("");
      refetchUser();
      qc.invalidateQueries({ queryKey: ["/api/admin/ait/transactions"] });
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const pushMutation = useMutation({
    mutationFn: () =>
      apiRequestJson("POST", "/api/admin/push/user", {
        userId: selectedId,
        title: pushTitle,
        body: pushBody,
        url: "/wallet",
      }),
    onSuccess: () => toast({ title: t("admin.pushSent") }),
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  if (!isAdmin) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground mb-4">{t("admin.accessDenied")}</p>
          <Button asChild variant="outline">
            <Link href="/">{t("admin.backHome")}</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-ait-orange">Ops</p>
            <h1 className="ait-section-title mt-1 flex items-center gap-2">
              <Shield className="h-7 w-7 text-ait-orange" />
              {t("admin.title")}
            </h1>
            <p className="mt-1 text-muted-foreground">{t("admin.subtitle")}</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← {t("admin.back")}
          </Button>
        </div>

        <Tabs defaultValue="ait">
          <TabsList className="ait-glass flex-wrap h-auto">
            <TabsTrigger value="ait" className="gap-1">
              <Coins className="h-4 w-4" />
              AIT
            </TabsTrigger>
            <TabsTrigger value="broadcast" className="gap-1">
              <Megaphone className="h-4 w-4" />
              {t("admin.tabs.broadcast")}
            </TabsTrigger>
            <TabsTrigger value="push" className="gap-1">
              <Bell className="h-4 w-4" />
              {t("admin.tabs.push")}
            </TabsTrigger>
            <TabsTrigger value="fraud" className="gap-1">
              <Shield className="h-4 w-4" />
              Fraud
            </TabsTrigger>
            <TabsTrigger value="flags" className="gap-1">
              <Flag className="h-4 w-4" />
              Flags
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ait" className="space-y-4 mt-4">
            <AitSurface padding="none" className="p-4">
              <Label className="text-xs text-muted-foreground">{t("admin.searchUser")}</Label>
              <div className="flex gap-2 mt-2">
                <SmartSearchField
                  className="flex-1"
                  placeholder={t("admin.searchPlaceholder")}
                  value={searchQ}
                  onChange={setSearchQ}
                />
              </div>
              {searchFetching && searchQ.trim().length >= 2 ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("admin.searching")}
                </div>
              ) : searchError && searchQ.trim().length >= 2 ? (
                <EmptyState
                  icon={AlertCircle}
                  title={t("admin.searchFailed")}
                  action={
                    <Button variant="outline" size="sm" onClick={() => refetchSearch()}>
                      {t("common.retry")}
                    </Button>
                  }
                  className="py-6"
                />
              ) : searchResults?.users?.length ? (
                <ul className="mt-3 divide-y divide-white/5 max-h-48 overflow-y-auto">
                  {searchResults.users.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className={`w-full text-left px-2 py-2 text-sm hover:bg-white/5 rounded-lg ${
                          selectedId === u.id ? "bg-ait-purple/15" : ""
                        }`}
                        onClick={() => setSelectedId(u.id)}
                      >
                        <span className="font-medium">
                          {[u.firstName, u.lastName].filter(Boolean).join(" ") || u.email}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {u.email} · Spend {u.spendBalance} · Creator {u.creatorBalance}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </AitSurface>

            {userDetailLoading && selectedId ? (
              <AitSurface
                padding="none"
                className="p-5 flex items-center justify-center gap-2 text-muted-foreground"
              >
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("admin.loadingUser")}
              </AitSurface>
            ) : userDetailError && selectedId ? (
              <EmptyState
                icon={AlertCircle}
                title={t("admin.userLoadFailed")}
                action={
                  <Button variant="outline" size="sm" onClick={() => refetchUser()}>
                    {t("common.retry")}
                  </Button>
                }
              />
            ) : userDetail && selectedId ? (
              <AitSurface padding="none" className="p-5 space-y-4">
                <div>
                  <p className="font-semibold">{userDetail.user.email}</p>
                  <p className="text-sm text-muted-foreground">
                    @{userDetail.user.username ?? "—"} · {userDetail.ait.creatorRank.title}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div className="ait-glass rounded-xl p-3">
                    <p className="text-muted-foreground text-xs">Spend AIT</p>
                    <p className="text-2xl font-bold tabular-nums">{userDetail.ait.spendBalance}</p>
                  </div>
                  <div className="ait-glass rounded-xl p-3">
                    <p className="text-muted-foreground text-xs">Creator AIT</p>
                    <p className="text-2xl font-bold text-ait-cyan tabular-nums">
                      {userDetail.ait.creatorBalance}
                    </p>
                  </div>
                </div>

                {(userDetail.ait.entitlements?.length ?? 0) > 0 && (
                  <div className="ait-glass rounded-xl p-3">
                    <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                      Entitlements
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {userDetail.ait.entitlements.map((e) => (
                        <li
                          key={`${e.sku}-${e.entityId ?? "x"}`}
                          className="rounded-full bg-ait-purple/20 px-2.5 py-1 text-[11px] font-medium text-ait-orange"
                        >
                          {e.sku}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>{t("admin.wallet")}</Label>
                    <select
                      className="mt-1 w-full ait-glass rounded-xl px-3 py-2 text-sm bg-transparent"
                      value={wallet}
                      onChange={(e) => setWallet(e.target.value as "spend" | "creator")}
                    >
                      <option value="spend">Spend</option>
                      <option value="creator">Creator</option>
                    </select>
                  </div>
                  <div>
                    <Label>{t("admin.adjustment")}</Label>
                    <Input
                      type="number"
                      className="mt-1 ait-glass rounded-xl"
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      placeholder={t("admin.adjustmentPlaceholder")}
                    />
                  </div>
                </div>
                <div>
                  <Label>{t("admin.ledgerNote")}</Label>
                  <Input
                    className="mt-1 ait-glass rounded-xl"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={t("admin.ledgerNotePlaceholder")}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={sendPush} onCheckedChange={setSendPush} id="admin-push-ait" />
                  <Label htmlFor="admin-push-ait" className="text-sm cursor-pointer">
                    {t("admin.pushOnCredit")}
                  </Label>
                </div>
                <Button
                  variant="premium"
                  className="rounded-xl w-full"
                  disabled={!delta || adjustMutation.isPending}
                  onClick={() => adjustMutation.mutate()}
                >
                  {t("admin.applyAdjustment")}
                </Button>

                <div className="border-t border-white/10 pt-4 max-h-56 overflow-y-auto">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">
                    {t("admin.ledger")}
                  </p>
                  {userDetail.ait.ledger.map((tx) => (
                    <div key={tx.id} className="flex justify-between text-xs py-1.5">
                      <span>{tx.title}</span>
                      <span className={tx.delta > 0 ? "text-emerald-400" : "text-red-400"}>
                        {tx.delta > 0 ? "+" : ""}
                        {tx.delta}
                      </span>
                    </div>
                  ))}
                </div>
              </AitSurface>
            ) : null}

            <AitSurface padding="none" className="p-4">
              <p className="font-semibold mb-3">{t("admin.recentTransactions")}</p>
              {globalTxLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {t("admin.loading")}
                </div>
              ) : globalTxError ? (
                <EmptyState
                  icon={AlertCircle}
                  title={t("admin.transactionsFailed")}
                  action={
                    <Button variant="outline" size="sm" onClick={() => refetchGlobalTx()}>
                      {t("common.retry")}
                    </Button>
                  }
                />
              ) : (
                <div className="max-h-64 overflow-y-auto text-sm divide-y divide-white/5">
                  {globalTx?.transactions?.map((tx) => (
                    <div key={tx.id} className="py-2 flex justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tx.userLabel}</p>
                        <p className="text-xs text-muted-foreground">{tx.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={tx.delta > 0 ? "text-emerald-400" : "text-red-400"}>
                          {tx.delta > 0 ? "+" : ""}
                          {tx.delta}
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          {format(new Date(tx.createdAt), "d MMM HH:mm", { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </AitSurface>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-4">
            <AitSurface padding="none" className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">{t("admin.broadcastHint")}</p>
              <AdminBroadcastDialog />
            </AitSurface>
          </TabsContent>

          <TabsContent value="push" className="mt-4 space-y-4">
            <AitSurface padding="none" className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">{t("admin.pushHint")}</p>
              {!selectedId ? (
                <p className="text-sm text-ait-orange">{t("admin.selectUserHint")}</p>
              ) : (
                <>
                  <div>
                    <Label>{t("admin.pushTitleLabel")}</Label>
                    <Input
                      className="mt-1 ait-glass rounded-xl"
                      value={pushTitle}
                      onChange={(e) => setPushTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>{t("admin.pushBodyLabel")}</Label>
                    <MessageComposer
                      value={pushBody}
                      onChange={setPushBody}
                      onSend={() => {}}
                      persistAfterMediaSend
                      placeholder={t("admin.pushBodyPlaceholder")}
                      className="w-full mt-1"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl"
                    disabled={!pushBody.trim() || pushMutation.isPending}
                    onClick={() => pushMutation.mutate()}
                  >
                    {t("admin.sendPush")}
                  </Button>
                </>
              )}
            </AitSurface>
          </TabsContent>

          <TabsContent value="fraud" className="mt-4 space-y-4">
            <AitSurface padding="none" className="p-5">
              <h3 className="font-semibold mb-3">{t("admin.fraudTitle")}</h3>
              {(fraudData?.flags ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.fraudEmpty")}</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {fraudData?.flags.map((f) => (
                    <li
                      key={f.userId}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2"
                    >
                      <span className="font-mono text-xs">{f.userId}</span>
                      <span className="flex items-center gap-2">
                        <span>
                          L{f.level} · {f.reason ?? "—"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={clearFraudMutation.isPending}
                          onClick={() => clearFraudMutation.mutate(f.userId)}
                        >
                          Clear
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </AitSurface>
          </TabsContent>

          <TabsContent value="flags" className="mt-4 space-y-4">
            <AitSurface padding="none" className="p-5 space-y-3">
              <h3 className="font-semibold">
                {t("admin.flagsTitle", { defaultValue: "Feature flags" })}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t("admin.flagsHint", {
                  defaultValue:
                    "Toggle platform foundation gates. Fail-closed defaults stay off until enabled.",
                })}
              </p>
              {(flagsData?.flags ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No flags loaded.</p>
              ) : (
                <ul className="space-y-3">
                  {flagsData?.flags.map((f) => (
                    <li
                      key={f.key}
                      className="flex items-center justify-between gap-3 rounded-xl ait-glass px-3 py-2"
                    >
                      <span className="font-mono text-xs">{f.key}</span>
                      <Switch
                        checked={f.enabled}
                        disabled={flagMutation.isPending}
                        onCheckedChange={(enabled) => flagMutation.mutate({ key: f.key, enabled })}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </AitSurface>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
