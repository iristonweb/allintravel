import { useEffect, useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import GlassCard from "@/components/brand/glass-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserPrivacySettings } from "@shared/privacy";
import type { PrivacyAudience } from "@shared/privacy";
import { Smartphone, Shield, Bell, AlertCircle } from "lucide-react";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import {
  isNotificationSoundEnabled,
  setNotificationSoundEnabled,
  playNotificationSound,
} from "@/lib/notification-sound";

const audienceOptions: { value: PrivacyAudience; label: string }[] = [
  { value: "everyone", label: "Все" },
  { value: "friends", label: "Только друзья" },
  { value: "nobody", label: "Никто" },
];

export function ProfileSettings() {
  const { isAuthenticated } = useAuth();
  const {
    supported: pushSupported,
    vapidReady,
    subscribed,
    subscribe,
    testPush,
  } = usePushNotifications();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<UserPrivacySettings>>({});
  const [soundOn, setSoundOn] = useState(() => isNotificationSoundEnabled());

  const {
    data: settings,
    isLoading,
    isError,
    refetch,
  } = useQuery<UserPrivacySettings>({
    queryKey: ["/api/settings/privacy"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (patch: Partial<UserPrivacySettings>) => {
      const res = await apiRequest("PUT", "/api/settings/privacy", patch);
      return (await res.json()) as UserPrivacySettings;
    },
    onSuccess: () => {
      toast({ title: "Настройки сохранены" });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/privacy"] });
    },
    onError: () => {
      toast({ title: "Не удалось сохранить", variant: "destructive" });
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch("/api/account/export", { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-in-travel-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Экспорт загружен" });
    } catch {
      toast({ title: "Не удалось экспортировать", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm("Удалить аккаунт безвозвратно? Все посты, сообщения и поездки будут удалены.")
    ) {
      return;
    }
    try {
      const res = await apiRequest("DELETE", "/api/account");
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/";
    } catch {
      toast({ title: "Не удалось удалить аккаунт", variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <p className="text-center text-muted-foreground">Войдите в систему</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="py-6 max-w-2xl mx-auto">
      <PageHeader
        title="Настройки"
        breadcrumbs={[{ label: "Профиль", href: "/profile" }, { label: "Настройки" }]}
      />
      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <EmptyState
          icon={AlertCircle}
          title="Не удалось загрузить настройки"
          action={
            <Button variant="outline" onClick={() => refetch()}>
              Повторить
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          <GlassCard className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Конфиденциальность</h2>
              <p className="text-sm text-muted-foreground">
                Кто видит ваш статус и может с вами связаться
              </p>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="private-account">Закрытый аккаунт</Label>
                <Switch
                  id="private-account"
                  checked={form.isPrivateAccount ?? false}
                  onCheckedChange={(v) => {
                    const next = { ...form, isPrivateAccount: v };
                    setForm(next);
                    saveMutation.mutate({ isPrivateAccount: v });
                  }}
                />
              </div>
              <AudienceSelect
                label="Кто видит, что я онлайн"
                value={form.showOnlineStatus ?? "friends"}
                onChange={(v) => {
                  setForm({ ...form, showOnlineStatus: v });
                  saveMutation.mutate({ showOnlineStatus: v });
                }}
              />
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="last-seen">Показывать время последнего визита</Label>
                <Switch
                  id="last-seen"
                  checked={form.showLastSeen ?? true}
                  onCheckedChange={(v) => {
                    setForm({ ...form, showLastSeen: v });
                    saveMutation.mutate({ showLastSeen: v });
                  }}
                />
              </div>
              <AudienceSelect
                label="Кто может писать в личные сообщения"
                value={form.allowDmFrom ?? "friends"}
                onChange={(v) => {
                  setForm({ ...form, allowDmFrom: v });
                  saveMutation.mutate({ allowDmFrom: v });
                }}
              />
              <AudienceSelect
                label="Кто может отправлять заявки в друзья"
                value={form.allowFriendRequestsFrom ?? "everyone"}
                onChange={(v) => {
                  setForm({ ...form, allowFriendRequestsFrom: v });
                  saveMutation.mutate({ allowFriendRequestsFrom: v });
                }}
              />
              <AudienceSelect
                label="Кто видит мой профиль"
                value={form.showProfileTo ?? "everyone"}
                onChange={(v) => {
                  setForm({ ...form, showProfileTo: v });
                  saveMutation.mutate({ showProfileTo: v });
                }}
              />
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push на телефон и браузер
              </h2>
              <p className="text-sm text-muted-foreground">
                Мгновенные уведомления о заявках, сообщениях, поездках и событиях (Web Push).
              </p>
            </div>
            <div className="space-y-3">
              {!pushSupported && (
                <p className="text-sm text-muted-foreground">
                  Браузер не поддерживает push-уведомления.
                </p>
              )}
              {pushSupported && !vapidReady && (
                <p className="text-sm text-muted-foreground">
                  На сервере не настроены VAPID-ключи. Добавьте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY
                  в .env.
                </p>
              )}
              {pushSupported && vapidReady && (
                <>
                  <p className="text-sm text-muted-foreground">
                    {subscribed
                      ? "Уведомления включены на этом устройстве."
                      : "Разрешите уведомления — вы будете получать их даже при закрытой вкладке."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => subscribe()}>
                      {subscribed ? "Обновить подписку" : "Включить push"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => testPush().catch(() => {})}
                    >
                      Тестовое уведомление
                    </Button>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10">
                    <div>
                      <p className="text-sm font-medium">Звук уведомлений</p>
                      <p className="text-xs text-muted-foreground">
                        Короткий сигнал при push, сообщениях и начислении AIT
                      </p>
                    </div>
                    <Switch
                      checked={soundOn}
                      onCheckedChange={(v) => {
                        setSoundOn(v);
                        setNotificationSoundEnabled(v);
                        if (v) playNotificationSound("default");
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-3">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                PIN для входа в приложение
              </h2>
              <p className="text-sm text-muted-foreground">
                Короткий PIN появится в мобильной версии All-in-travel для быстрого входа.
              </p>
            </div>
            <Button variant="secondary" disabled>
              Скоро в мобильной версии
            </Button>
          </GlassCard>

          <GlassCard className="p-6 space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Аккаунт и данные
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/privacy">Политика конфиденциальности</Link>
              </Button>
              <Button variant="outline" type="button" onClick={handleExport}>
                Скачать мои данные
              </Button>
              <Button variant="destructive" type="button" onClick={handleDelete}>
                Удалить аккаунт
              </Button>
            </div>
          </GlassCard>
        </div>
      )}
    </AppLayout>
  );
}

function AudienceSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: PrivacyAudience;
  onChange: (v: PrivacyAudience) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as PrivacyAudience)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {audienceOptions.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default ProfileSettings;
