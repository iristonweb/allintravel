import { useEffect, useState } from "react";
import { Link } from "wouter";
import AppLayout from "@/components/app-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
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
        <EmptyState
          variant="glass"
          title={t("profileSettings.signInRequired")}
          className="max-w-md mx-auto"
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout contentClassName="py-6" columnMaxWidth="feed">
      <ReelsPageLayout
        header={
          <div className="space-y-2">
            <Link
              href="/profile"
              className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
            >
              ← {t("profileSettings.breadcrumbProfile")}
            </Link>
            <AitSectionHeader title={t("profileSettings.title")} />
          </div>
        }
        feed={
          isLoading ? (
            <div className="space-y-6" aria-busy="true" aria-label={t("profile.loading")}>
              <Skeleton className="h-48 w-full rounded-card-lg" />
              <Skeleton className="h-40 w-full rounded-card-lg" />
            </div>
          ) : isError ? (
            <EmptyState
              variant="glass"
              icon={AlertCircle}
              title={t("profileSettings.loadError")}
              action={
                <AitButton variant="glass" size="sm" onClick={() => refetch()}>
                  {t("common.retry")}
                </AitButton>
              }
            />
          ) : (
            <div className="space-y-6">
              <AitSurface className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">{t("profileSettings.privacyTitle")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t("profileSettings.privacyHint")}
                  </p>
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
              </AitSurface>

              <AitSurface className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Bell className="h-5 w-5" strokeWidth={1.5} aria-hidden />
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
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {t("profileSettings.pushPhoneHint", {
                          defaultValue:
                            "For notifications on a phone: allow permission here. On iPhone, first Add to Home Screen, then open the installed app and enable push.",
                        })}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <AitButton
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => subscribe()}
                        >
                          {subscribed
                            ? t("profileSettings.pushRefresh")
                            : t("profileSettings.pushSubscribe")}
                        </AitButton>
                        <AitButton
                          type="button"
                          variant="glass"
                          size="sm"
                          onClick={() => testPush().catch(() => {})}
                          disabled={!subscribed}
                        >
                          {t("profileSettings.pushTest")}
                        </AitButton>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
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
              </AitSurface>

              <AitSurface className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Smartphone className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                    {t("profileSettings.pinTitle")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("profileSettings.pinHint")}</p>
                </div>
                <AitButton variant="glass" size="sm" disabled>
                  {t("profileSettings.pinSoon")}
                </AitButton>
              </AitSurface>

              <AitSurface className="space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                  {t("profileSettings.accountTitle")}
                </h2>
                <div className="flex flex-wrap gap-3">
                  <AitButton variant="glass" size="sm" asChild>
                    <Link href="/privacy">{t("profileSettings.privacyPolicy")}</Link>
                  </AitButton>
                  <AitButton variant="glass" size="sm" type="button" onClick={handleExport}>
                    {t("profileSettings.exportData")}
                  </AitButton>
                  <AitButton
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={handleDelete}
                    className="text-destructive hover:text-destructive"
                  >
                    {t("profileSettings.deleteAccount")}
                  </AitButton>
                </div>
              </AitSurface>
            </div>
          )
        }
      />
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
