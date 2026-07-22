import { Link, useParams } from "wouter";
import AppLayout from "@/components/app-layout";
import DiscoveryRightRail from "@/components/community/DiscoveryRightRail";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import ProfileHeroSkeleton from "@/components/profile/ProfileHeroSkeleton";
import CreatorAvatar from "@/components/ait/CreatorAvatar";
import UserTipButton from "@/components/ait/UserTipButton";
import FollowButton from "@/components/social/FollowButton";
import TravelIdentityCard from "@/components/identity/TravelIdentityCard";
import EmptyState from "@/components/empty-state";
import PageMeta from "@/components/seo/PageMeta";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { getUserDisplayLabel, getUserHandle, getUserInitial } from "@shared/user-display";
import type { UserProfile } from "@shared/schema";
import { MessageCircle, UserPlus, MapPin, Compass, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

type PublicUserView = {
  id: string;
  username: string | null;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isOnline?: boolean;
  lastSeenAt?: string;
  isFriend?: boolean;
  creatorBadge?: boolean;
  creatorRank?: { title: string };
};

export function UserPublicProfile() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user: me } = useAuth();

  const {
    data: publicUser,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<PublicUserView>({
    queryKey: [`/api/users/by-username/${username}`],
    enabled: username.length >= 3,
  });

  const { data: profile } = useQuery<UserProfile | null>({
    queryKey: [`/api/profile/${publicUser?.id}`],
    enabled: !!publicUser?.id,
  });

  const { data: passportShare } = useQuery<{
    displayName: string;
    countriesCount: number;
    stamps: unknown[];
    profileImageUrl: string | null;
  }>({
    queryKey: [`/api/passport/public/${username}`],
    enabled: username.length >= 3,
  });

  const sendRequestMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/friends/request/${publicUser!.id}`),
    onSuccess: () => {
      toast({ title: t("userPublic.requestSent") });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests/sent"] });
    },
    onError: () => toast({ title: t("userPublic.requestFailed"), variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <AppLayout contentClassName="py-6" rightRail={<DiscoveryRightRail />} columnMaxWidth="feed">
        <div aria-label={t("userPublic.loading")}>
          <ProfileHeroSkeleton />
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout contentClassName="py-16 max-w-lg mx-auto">
        <EmptyState
          variant="glass"
          icon={AlertCircle}
          title={t("userPublic.loadError")}
          description={error instanceof Error ? error.message : undefined}
          action={
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <AitButton variant="glass" size="sm" onClick={() => refetch()}>
                {t("common.retry")}
              </AitButton>
              <AitButton variant="ghost" size="sm" asChild>
                <Link href="/profile">{t("userPublic.myProfile")}</Link>
              </AitButton>
            </div>
          }
        />
      </AppLayout>
    );
  }

  if (!publicUser) {
    return (
      <AppLayout contentClassName="py-16">
        <EmptyState
          variant="glass"
          title={t("userPublic.notFoundTitle")}
          description={t("userPublic.notFoundHint")}
          action={
            <AitButton variant="glass" size="sm" asChild>
              <Link href="/profile">{t("userPublic.myProfile")}</Link>
            </AitButton>
          }
          className="max-w-md mx-auto"
        />
      </AppLayout>
    );
  }

  const displayLabel = getUserDisplayLabel(publicUser);

  return (
    <AppLayout contentClassName="py-6" rightRail={<DiscoveryRightRail />} columnMaxWidth="feed">
      {passportShare && (
        <PageMeta
          title={t("userPublic.metaTitle", { name: passportShare.displayName })}
          description={t("userPublic.metaDescription", {
            countries: passportShare.countriesCount,
            stamps: passportShare.stamps?.length ?? 0,
          })}
          path={`/u/${username}`}
        />
      )}
      <ReelsPageLayout
        header={
          <div className="space-y-2">
            <Link
              href="/profile"
              className="text-xs text-muted-foreground hover:text-ait-purple transition-colors"
            >
              ← {t("userPublic.breadcrumbProfile")}
            </Link>
            <AitSectionHeader title={displayLabel} />
          </div>
        }
        feed={
          <>
            <AitSurface>
              <div className="flex gap-4 items-start">
                <CreatorAvatar
                  className="h-20 w-20 shrink-0"
                  src={publicUser.profileImageUrl}
                  fallback={getUserInitial(publicUser)}
                  creatorBadge={publicUser.creatorBadge}
                  label={displayLabel}
                />
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">{displayLabel}</h2>
                  {publicUser.creatorRank && (
                    <Badge variant="secondary" className="mt-1 text-ait-purple">
                      {publicUser.creatorRank.title}
                    </Badge>
                  )}
                  {getUserHandle(publicUser) && (
                    <p className="text-muted-foreground">{getUserHandle(publicUser)}</p>
                  )}
                  {publicUser.isOnline !== undefined && (
                    <p className="text-sm mt-1">
                      {publicUser.isOnline ? (
                        <span className="text-emerald-400">{t("userPublic.online")}</span>
                      ) : publicUser.lastSeenAt ? (
                        <span className="text-muted-foreground">
                          {t("userPublic.recentlyActive")}
                        </span>
                      ) : null}
                    </p>
                  )}
                </div>
              </div>
              {profile?.bio && (
                <p className="mt-4 text-muted-foreground leading-relaxed">{profile.bio}</p>
              )}
              {profile?.location && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                  {profile.location}
                </p>
              )}
              {profile?.travelStyle && (
                <p className="mt-2 flex items-center gap-1.5 text-sm">
                  <Compass className="h-4 w-4 text-ait-purple shrink-0" strokeWidth={1.5} />
                  <span className="text-muted-foreground">{t("userPublic.travelStyle")}</span>{" "}
                  {profile.travelStyle}
                </p>
              )}
              {profile?.website && (
                <p className="mt-2 text-sm">
                  <a
                    href={
                      profile.website.startsWith("http")
                        ? profile.website
                        : `https://${profile.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ait-purple hover:underline break-all"
                  >
                    {profile.website}
                  </a>
                </p>
              )}
              {(profile?.interests?.length ?? 0) > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">{t("userPublic.interests")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile!.interests!.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs rounded-full">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(profile?.languages?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">{t("userPublic.languages")}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile!.languages!.map((lang) => (
                      <Badge key={lang} variant="outline" className="text-xs rounded-full">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(profile?.favoriteDestinations?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    {t("userPublic.favoriteDestinations")}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile!.favoriteDestinations!.map((dest) => (
                      <Badge key={dest} variant="outline" className="text-xs rounded-full">
                        {dest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2 mt-6">
                <AitButton variant="primary" size="sm" asChild>
                  <Link href={`/chat?with=${publicUser.id}&tab=personal`}>
                    <MessageCircle className="h-4 w-4 mr-1" strokeWidth={1.5} />
                    {t("userPublic.message")}
                  </Link>
                </AitButton>
                {!publicUser.isFriend && (
                  <AitButton
                    size="sm"
                    variant="glass"
                    onClick={() => sendRequestMutation.mutate()}
                    disabled={sendRequestMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4 mr-1" strokeWidth={1.5} />
                    {t("userPublic.addFriend")}
                  </AitButton>
                )}
                <FollowButton userId={publicUser.id} />
                <UserTipButton userId={publicUser.id} currentUserId={me?.id} />
              </div>
            </AitSurface>
            <div className="mt-6">
              <TravelIdentityCard username={publicUser.username} userId={publicUser.id} compact />
            </div>
          </>
        }
      />
    </AppLayout>
  );
}

export default UserPublicProfile;
