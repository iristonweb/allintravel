import { useEffect, useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Smartphone, Shield, Bell } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

const audienceOptions: { value: PrivacyAudience; label: string }[] = [
  { value: "everyone", label: "Все" },
  { value: "friends", label: "Только друзья" },
  { value: "nobody", label: "Никто" },
];

export function ProfileSettings() {
  const { isAuthenticated } = useAuth();
  const { supported: pushSupported, vapidReady, subscribed, subscribe, testPush } =
    usePushNotifications();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<UserPrivacySettings>>({});

  const { data: settings, isLoading } = useQuery<UserPrivacySettings>({
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
      !window.confirm(
        "Удалить аккаунт безвозвратно? Все посты, сообщения и поездки будут удалены.",
      )
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
      <PageHeader title="Настройки" backHref="/profile" />
      {isLoading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Конфиденциальность</CardTitle>
              <CardDescription>Кто видит ваш статус и может с вами связаться</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push на телефон и браузер
              </CardTitle>
              <CardDescription>
                Мгновенные уведомления о заявках, сообщениях, поездках и событиях (Web Push).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!pushSupported && (
                <p className="text-sm text-muted-foreground">Браузер не поддерживает push-уведомления.</p>
              )}
              {pushSupported && !vapidReady && (
                <p className="text-sm text-muted-foreground">
                  На сервере не настроены VAPID-ключи. Добавьте VAPID_PUBLIC_KEY и VAPID_PRIVATE_KEY в .env.
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
                    <Button type="button" variant="outline" onClick={() => testPush().catch(() => {})}>
                      Тестовое уведомление
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                PIN для входа в приложение
              </CardTitle>
              <CardDescription>
                Короткий PIN появится в мобильной версии All-in-travel для быстрого входа.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" disabled>
                Скоро в мобильной версии
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Аккаунт и данные
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/privacy">Политика конфиденциальности</Link>
              </Button>
              <Button variant="outline" type="button" onClick={handleExport}>
                Скачать мои данные
              </Button>
              <Button variant="destructive" type="button" onClick={handleDelete}>
                Удалить аккаунт
              </Button>
            </CardContent>
          </Card>
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
