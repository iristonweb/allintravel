import { useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import PublicLayout from "@/components/public-layout";
import AppLayout from "@/components/app-layout";
import ReelsPageLayout from "@/components/feed/ReelsPageLayout";
import AitSectionHeader from "@/components/ait-ui/AitSectionHeader";
import AitSurface from "@/components/ait-ui/AitSurface";
import AitButton from "@/components/ait-ui/AitButton";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequestJson } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";
import { Users, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";

type InvitePreview = {
  trip: Trip;
  stopCount: number;
  referrerId: string;
};

export default function TripJoinPage() {
  const { token } = useParams();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data, isLoading } = useQuery<InvitePreview>({
    queryKey: ["/api/trips/invite", token],
    queryFn: () => apiRequestJson("GET", `/api/trips/invite/${token}`),
    enabled: !!token,
  });

  const joinMutation = useMutation({
    mutationFn: () =>
      apiRequestJson<{ trip: Trip; referralApplied: boolean }>(
        "POST",
        `/api/trips/invite/${token}/join`,
      ),
    onSuccess: (result) => {
      toast({
        title: t("tripJoin.joined"),
        description: result.referralApplied ? t("tripJoin.referralBonus") : undefined,
      });
      navigate(`/trips/${result.trip.id}`);
    },
    onError: (e: Error) => toast({ title: e.message, variant: "destructive" }),
  });

  const joinedRef = useRef(false);
  useEffect(() => {
    if (!authLoading && isAuthenticated && data && token && !joinedRef.current) {
      joinedRef.current = true;
      joinMutation.mutate();
    }
  }, [authLoading, isAuthenticated, data, token, joinMutation]);

  const Layout = isAuthenticated ? AppLayout : PublicLayout;

  if (isLoading || authLoading) {
    return (
      <Layout contentClassName="py-8">
        <div
          className="space-y-4 max-w-lg mx-auto"
          aria-busy="true"
          aria-label={t("tripJoin.loading")}
        >
          <Skeleton className="h-10 w-48 mx-auto rounded-lg" />
          <Skeleton className="h-48 w-full rounded-card-xl" />
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout contentClassName="py-8">
        <EmptyState
          variant="glass"
          title={t("tripJoin.notFoundTitle")}
          description={t("tripJoin.notFound")}
          className="max-w-md mx-auto"
        />
      </Layout>
    );
  }

  return (
    <Layout contentClassName="py-8">
      <ReelsPageLayout
        header={<AitSectionHeader title={t("tripJoin.title")} />}
        feed={
          <AitSurface padding="lg" className="max-w-lg mx-auto text-center space-y-4">
            <Users className="h-10 w-10 mx-auto text-primary" aria-hidden />
            <p className="text-muted-foreground">
              «{data.trip.title}» · {data.trip.destination}
            </p>
            <p className="text-sm">{t("tripJoin.stops", { count: data.stopCount })}</p>
            {!isAuthenticated ? (
              <AitButton variant="primary" className="gap-2" asChild>
                <Link href={`/login?redirect=${encodeURIComponent(`/trips/join/${token}`)}`}>
                  <LogIn className="h-4 w-4" aria-hidden />
                  {t("tripJoin.signInToJoin")}
                </Link>
              </AitButton>
            ) : (
              <p className="text-sm text-muted-foreground">{t("tripJoin.joining")}</p>
            )}
          </AitSurface>
        }
      />
    </Layout>
  );
}
