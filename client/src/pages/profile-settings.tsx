import { useEffect, useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import PageShell from "@/components/layout/page-shell";
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
import { useTranslation } from "react-i18next";
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

const audienceOptions = (
  t: (key: string) => string,
): { value: PrivacyAudience; label: string }[] => [
  { value: "everyone", label: t("profileSettings.audienceEveryone") },
  { value: "friends", label: t("profileSettings.audienceFriends") },
  { value: "nobody", label: t("profileSettings.audienceNobody") },
];

export function ProfileSettings() {
  const { t } = useTranslation();
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
      toast({ title: t("profileSettings.saved") });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/privacy"] });
    },
    onError: () => {
      toast({ title: t("profileSettings.saveFailed"), variant: "destructive" });
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
      toast({ title: t("profileSettings.exportDone") });
    } catch {
      toast({ title: t("profileSettings.exportFailed"), variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(t("profileSettings.deleteConfirm"))) {
      return;
    }
    try {
      const res = await apiRequest("DELETE", "/api/account");
      if (!res.ok) throw new Error("Delete failed");
      window.location.href = "/";
    } catch {
      toast({ title: t("profileSettings.deleteFailed"), variant: "destructive" });
    }
  };

  if (!isAuthenticated) {
    return (
      <AppLayout contentClassName="py-16">
        <p className="text-center text-muted-foreground">{t("profileSettings.signInRequired")}</p>
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="py-6 max-w-2xl mx-auto">
      <PageShell
        title={t("profileSettings.title")}
        breadcrumbs={[
          { label: t("profileSettings.breadcrumbProfile"), href: "/profile" },
          { label: t("profileSettings.title") },
        ]}
      >
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title={t("profileSettings.loadError")}
            action={
              <Button variant="outline" onClick={() => refetch()}>
                {t("common.retry")}
              </Button>
            }
          />
        ) : (
          <div className="space-y-6">
            <GlassCard className="p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold">{t("profileSettings.privacyTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("profileSettings.privacyHint")}</p>
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="private-account">{t("profileSettings.privateAccount")}</Label>
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
                  label={t("profileSettings.showOnlineStatus")}
                  value={form.showOnlineStatus ?? "friends"}
                  onChange={(v) => {
                    setForm({ ...form, showOnlineStatus: v });
                    saveMutation.mutate({ showOnlineStatus: v });
                  }}
                />
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="last-seen">{t("profileSettings.showLastSeen")}</Label>
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
                  label={t("profileSettings.allowDmFrom")}
                  value={form.allowDmFrom ?? "friends"}
                  onChange={(v) => {
                    setForm({ ...form, allowDmFrom: v });
                    saveMutation.mutate({ allowDmFrom: v });
                  }}
                />
                <AudienceSelect
                  label={t("profileSettings.allowFriendRequests")}
                  value={form.allowFriendRequestsFrom ?? "everyone"}
                  onChange={(v) => {
                    setForm({ ...form, allowFriendRequestsFrom: v });
                    saveMutation.mutate({ allowFriendRequestsFrom: v });
                  }}
                />
                <AudienceSelect
                  label={t("profileSettings.showProfileTo")}
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
                  {t("profileSettings.pushTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("profileSettings.pushHint")}</p>
              </div>
              <div className="space-y-3">
                {!pushSupported && (
                  <p className="text-sm text-muted-foreground">
                    {t("profileSettings.pushUnsupported")}
                  </p>
                )}
                {pushSupported && !vapidReady && (
                  <p className="text-sm text-muted-foreground">
                    {t("profileSettings.pushNoVapid")}
                  </p>
                )}
                {pushSupported && vapidReady && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {subscribed
                        ? t("profileSettings.pushEnabled")
                        : t("profileSettings.pushDisabled")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" onClick={() => subscribe()}>
                        {subscribed
                          ? t("profileSettings.pushRefresh")
                          : t("profileSettings.pushSubscribe")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => testPush().catch(() => {})}
                      >
                        {t("profileSettings.pushTest")}
                      </Button>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div>
                        <p className="text-sm font-medium">{t("profileSettings.soundTitle")}</p>
                        <p className="text-xs text-muted-foreground">
                          {t("profileSettings.soundHint")}
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
                  {t("profileSettings.pinTitle")}
                </h2>
                <p className="text-sm text-muted-foreground">{t("profileSettings.pinHint")}</p>
              </div>
              <Button variant="secondary" disabled>
                {t("profileSettings.pinSoon")}
              </Button>
            </GlassCard>

            <GlassCard className="p-6 space-y-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t("profileSettings.accountTitle")}
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" asChild>
                  <Link href="/privacy">{t("profileSettings.privacyPolicy")}</Link>
                </Button>
                <Button variant="outline" type="button" onClick={handleExport}>
                  {t("profileSettings.exportData")}
                </Button>
                <Button variant="destructive" type="button" onClick={handleDelete}>
                  {t("profileSettings.deleteAccount")}
                </Button>
              </div>
            </GlassCard>
          </div>
        )}
      </PageShell>
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
  const { t } = useTranslation();
  const options = audienceOptions(t);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as PrivacyAudience)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
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
