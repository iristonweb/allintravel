import AppLayout from "@/components/app-layout";
import CinematicHero from "@/components/premium/CinematicHero";
import FeatureFooter from "@/components/marketing/feature-footer";
import HomeContinue from "@/components/home/home-continue";
import HomeQuickActions from "@/components/home/home-quick-actions";
import HomeExplorePlannerSection from "@/components/home/home-explore-planner-section";
import HomeCommunityPreview from "@/components/home/home-community-preview";
import HomeMobileShowcase from "@/components/home/home-mobile-showcase";
import HomePersonalized from "@/components/home/home-personalized";
import HomeSimilar from "@/components/home/home-similar";
import HeroStats from "@/components/home/hero-stats";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import AitDailyPulse from "@/components/ait/AitDailyPulse";
import SocialTeaser from "@/components/social/SocialTeaser";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { Place, Trip, Event, TripWaypointWithPlace } from "@shared/schema";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import { isOnboardingDone } from "@/lib/onboarding";
import { useTranslation } from "react-i18next";

export function Home() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isOnboardingDone()) {
      setOnboardingOpen(true);
    }
  }, [isAuthenticated]);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: places = [],
    isLoading: placesLoading,
    isError: placesError,
    refetch: refetchPlaces,
  } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 30 }],
  });

  const {
    data: trips = [],
    isLoading: tripsLoading,
    isError: tripsError,
    refetch: refetchTrips,
  } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { limit: 4 }],
  });

  const { data: participations = { tripIds: [] as string[] } } = useQuery<{ tripIds: string[] }>({
    queryKey: ["/api/trips/my-participations"],
    enabled: isAuthenticated,
  });

  const joinTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/join`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? t("tripsPage.toast.joinFailed"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips/my-participations"] });
      toast({ title: t("home.joinSuccess") });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const {
    data: events = [],
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useQuery<Event[]>({
    queryKey: ["/api/events", { upcoming: true, limit: 4 }],
  });

  const dataLoading = placesLoading || tripsLoading || eventsLoading;
  const dataError = placesError || tripsError || eventsError;

  const refetchAll = () => {
    void refetchPlaces();
    void refetchTrips();
    void refetchEvents();
  };

  const myTrip = trips[0];

  const { data: myTripWaypoints = [] } = useQuery<TripWaypointWithPlace[]>({
    queryKey: ["/api/trips", myTrip?.id, "waypoints"],
    enabled: !!myTrip?.id,
  });

  return (
    <AppLayout immersive contentClassName="p-0">
      <OnboardingWizard open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
      <CinematicHero trips={trips} showAnchorPills />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-24">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:hidden"
        >
          <HeroStats />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:hidden space-y-4"
        >
          <h2 className="text-3xl font-bold">
            {user?.firstName
              ? t("home.greetingNamed", { name: user.firstName })
              : t("home.greeting")}
          </h2>
          <HomeQuickActions />
          {isAuthenticated && <AitDailyPulse />}
          {isAuthenticated && <SocialTeaser />}
        </motion.section>

        {isAuthenticated && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="hidden md:block space-y-4 max-w-xl"
          >
            <AitDailyPulse />
            <SocialTeaser />
          </motion.section>
        )}

        {dataError ? (
          <EmptyState
            icon={AlertCircle}
            title={t("home.loadError")}
            description={t("home.connectionError")}
            action={
              <Button variant="outline" onClick={refetchAll}>
                {t("common.retry")}
              </Button>
            }
          />
        ) : dataLoading ? (
          <div className="space-y-8">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            <HomeExplorePlannerSection places={places} trip={myTrip} waypoints={myTripWaypoints} />
            <HomeCommunityPreview useLiveData />
            <HomeMobileShowcase />

            <HomeContinue
              trips={trips}
              events={events}
              joinedTripIds={participations.tripIds}
              onJoinTrip={(id) => joinTripMutation.mutate(id)}
            />
            {isAuthenticated && (
              <>
                <HomePersonalized />
                <HomeSimilar />
              </>
            )}
          </>
        )}
      </div>

      <FeatureFooter showAnchors />
    </AppLayout>
  );
}

export default Home;
