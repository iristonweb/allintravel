import { useState } from "react";
import TravelIdentityCard from "@/components/identity/TravelIdentityCard";
import AitDailyPulse from "@/components/ait/AitDailyPulse";
import PlatformWalletCard from "@/components/wallet/PlatformWalletCard";
import AppLayout from "@/components/app-layout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import ProfileHeroCard from "@/components/profile/ProfileHeroCard";
import ProfileHeroSkeleton from "@/components/profile/ProfileHeroSkeleton";
import ProfileHubGrid from "@/components/profile/ProfileHubGrid";
import ProfileUsernameSearch from "@/components/profile/ProfileUsernameSearch";
import EmptyState from "@/components/empty-state";
import { AlertCircle } from "lucide-react";
import { useProfileHubLinks } from "@/lib/profile-hub-links";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformWallet } from "@/hooks/usePlatformWallet";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { unsubscribePush } from "@/lib/push-subscription";

export function Profile() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [nickSearch, setNickSearch] = useState("");
  const { linksWithMap } = useProfileHubLinks();
  const { data: walletProfile } = usePlatformWallet(isAuthenticated);

  const {
    data: friends = [],
    isLoading: friendsLoading,
    isError: friendsError,
    refetch: refetchFriends,
  } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: searchResults = [] } = useQuery<User[]>({
    queryKey: ["/api/search/users", { q: nickSearch, exact: "1" }],
    enabled: nickSearch.replace(/^@/, "").length >= 3,
  });

  if (!isAuthenticated || !user) {
    return (
      <AppLayout contentClassName="py-16">
        <EmptyState
          variant="glass"
          title={t("profile.signInRequired")}
          className="max-w-md mx-auto"
        />
      </AppLayout>
    );
  }

  const handleNickSearch = () => {
    const term = nickSearch.trim().replace(/^@/, "");
    if (term.length < 3) return;
    navigate(`/u/${term}`);
  };

  const logout = async () => {
    await unsubscribePush().catch(() => undefined);
    await apiRequest("POST", "/api/logout");
    window.location.href = "/";
  };

  return (
    <AppLayout contentClassName="py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <AitSectionHeader title={t("nav.profile")} description={t("profile.hubHint")} />
          {user.isPremium && (
            <span className="mb-1 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              Premium
            </span>
          )}
        </div>
        {friendsLoading ? (
          <div aria-label={t("profile.loading")}>
            <ProfileHeroSkeleton />
          </div>
        ) : friendsError ? (
          <EmptyState
            variant="glass"
            icon={AlertCircle}
            title={t("profile.loadError")}
            action={
              <AitButton variant="glass" size="sm" onClick={() => refetchFriends()}>
                {t("common.retry")}
              </AitButton>
            }
          />
        ) : (
          <div className="space-y-5">
            <ProfileHeroCard user={user} friends={friends} onLogout={() => void logout()} />
            <TravelIdentityCard compact />
            <AitDailyPulse />
            <PlatformWalletCard compact />
            <ProfileHubGrid links={linksWithMap} walletBalance={walletProfile?.spendBalance} />
            <ProfileUsernameSearch
              value={nickSearch}
              onChange={setNickSearch}
              onSearch={handleNickSearch}
              results={searchResults}
            />
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default Profile;
