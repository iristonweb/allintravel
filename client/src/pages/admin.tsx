import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppLayout from "@/components/app-layout";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AdminBroadcastDialog from "@/components/admin/AdminBroadcastDialog";
import MessageComposer from "@/components/chat/MessageComposer";
import { Shield, Coins, Bell, Megaphone, Search } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

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
    ledger: { id: string; wallet: string; delta: number; title: string; reason: string; createdAt: string }[];
  };
};

export default function AdminPage() {
  const { user } = useAuth();
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

  if (!user?.isAdmin) {
    return (
      <AppLayout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground mb-4">Доступ только для администраторов</p>
          <Button asChild variant="outline">
            <Link href="/">На главную</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const { data: searchResults } = useQuery<{ users: SearchUser[] }>({
    queryKey: ["/api/admin/ait/search", searchQ],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ait/search?q=${encodeURIComponent(searchQ)}`);
      return res.json();
    },
    enabled: searchQ.trim().length >= 2,
  });

  const { data: userDetail, refetch: refetchUser } = useQuery<UserAitDetail>({
    queryKey: ["/api/admin/ait/users", selectedId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/admin/ait/users/${selectedId}`);
      return res.json();
    },
    enabled: !!selectedId,
  });

  const { data: globalTx } = useQuery<{
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
      toast({ title: "Баланс обновлён" });
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
    onSuccess: () => toast({ title: "Push отправлен" }),
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="ait-section-title flex items-center gap-2">
              <Shield className="h-8 w-8 text-ait-orange" />
              Админ-панель
            </h1>
            <p className="text-muted-foreground mt-1">AIT, рассылки и push-уведомления</p>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")}>
            ← Назад
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
              Рассылка
            </TabsTrigger>
            <TabsTrigger value="push" className="gap-1">
              <Bell className="h-4 w-4" />
              Push
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ait" className="space-y-4 mt-4">
            <GlassCard className="p-4">
              <Label className="text-xs text-muted-foreground">Поиск пользователя</Label>
              <div className="flex gap-2 mt-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 ait-glass rounded-xl"
                    placeholder="Email, username, имя…"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                  />
                </div>
              </div>
              {searchResults?.users?.length ? (
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
            </GlassCard>

            {userDetail && selectedId && (
              <GlassCard className="p-5 space-y-4">
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

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <Label>Кошелёк</Label>
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
                    <Label>Изменение (+ / −)</Label>
                    <Input
                      type="number"
                      className="mt-1 ait-glass rounded-xl"
                      value={delta}
                      onChange={(e) => setDelta(e.target.value)}
                      placeholder="100 или -50"
                    />
                  </div>
                </div>
                <div>
                  <Label>Комментарий в леджере</Label>
                  <Input
                    className="mt-1 ait-glass rounded-xl"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Причина корректировки"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={sendPush} onCheckedChange={setSendPush} id="admin-push-ait" />
                  <Label htmlFor="admin-push-ait" className="text-sm cursor-pointer">
                    Push со звуком при начислении
                  </Label>
                </div>
                <Button
                  className="ait-btn-glow text-white rounded-xl w-full"
                  disabled={!delta || adjustMutation.isPending}
                  onClick={() => adjustMutation.mutate()}
                >
                  Применить корректировку
                </Button>

                <div className="border-t border-white/10 pt-4 max-h-56 overflow-y-auto">
                  <p className="text-xs font-bold uppercase text-muted-foreground mb-2">Леджер</p>
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
              </GlassCard>
            )}

            <GlassCard className="p-4">
              <p className="font-semibold mb-3">Последние транзакции AIT (все)</p>
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
                        {format(new Date(tx.createdAt), "d MMM HH:mm", { locale: ru })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </TabsContent>

          <TabsContent value="broadcast" className="mt-4">
            <GlassCard className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                Объявление появится у всех в приложении и уйдёт push-уведомлением со звуком (если включён push).
              </p>
              <AdminBroadcastDialog />
            </GlassCard>
          </TabsContent>

          <TabsContent value="push" className="mt-4 space-y-4">
            <GlassCard className="p-5 space-y-3">
              <p className="text-sm text-muted-foreground">
                Произвольный push выбранному пользователю. Сначала найдите его во вкладке AIT.
              </p>
              {!selectedId ? (
                <p className="text-sm text-ait-orange">Выберите пользователя во вкладке AIT</p>
              ) : (
                <>
                  <div>
                    <Label>Заголовок</Label>
                    <Input className="mt-1 ait-glass rounded-xl" value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} />
                  </div>
                  <div>
                    <Label>Текст</Label>
                    <MessageComposer
                      value={pushBody}
                      onChange={setPushBody}
                      onSend={(b) => setPushBody(b ?? "")}
                      placeholder="Текст push…"
                      className="w-full mt-1"
                    />
                  </div>
                  <Button
                    className="w-full rounded-xl"
                    disabled={!pushBody.trim() || pushMutation.isPending}
                    onClick={() => pushMutation.mutate()}
                  >
                    Отправить push
                  </Button>
                </>
              )}
            </GlassCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
