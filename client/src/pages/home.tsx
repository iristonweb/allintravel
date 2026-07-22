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
import CommunityStatsRow from "@/components/community/CommunityStatsRow";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, apiRequestJson } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import TravelJourneyStrip from "@/components/journey/TravelJourneyStrip";
import { fetchOnboardingDone } from "@/lib/onboarding";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import EmptyState from "@/components/empty-state";
import TripCardSkeleton from "@/components/trips/TripCardSkeleton";
import EventCardSkeleton from "@/components/events/EventCardSkeleton";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import type { Place, Trip, Event, TripWaypointWithPlace } from "@shared/schema";
import { motion } from "framer-motion";

export function Home() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    void fetchOnboardingDone().then((done) => {
      if (!done) setOnboardingOpen(true);
    });
  }, [isAuthenticated]);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);

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

  const { data: registrations = { eventIds: [] as string[] } } = useQuery<{ eventIds: string[] }>({
    queryKey: ["/api/events/registrations"],
    enabled: isAuthenticated,
  });

  const checkoutMutation = useMutation({
    mutationFn: (eventId: string) => {
      setRegisteringEventId(eventId);
      return apiRequestJson<{ confirmationUrl: string; status: string }>(
        "POST",
        `/api/events/${eventId}/checkout`,
      );
    },
    onSuccess: (data) => {
      window.location.href = data.confirmationUrl;
    },
    onError: () => toast({ title: t("events.checkoutFailed"), variant: "destructive" }),
    onSettled: () => setRegisteringEventId(null),
  });

  const registerMutation = useMutation({
    mutationFn: ({ eventId, paid }: { eventId: string; paid?: boolean }) => {
      setRegisteringEventId(eventId);
      return apiRequestJson("POST", `/api/events/${eventId}/register`, paid ? { paid: true } : {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events/registrations"] });
      toast({ title: t("events.registered"), description: t("events.registeredHint") });
    },
    onError: () => toast({ title: t("events.registerFailed"), variant: "destructive" }),
    onSettled: () => setRegisteringEventId(null),
  });

  const handleRegisterEvent = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (ev?.price && ev.price > 0) {
      checkoutMutation.mutate(eventId);
      return;
    }
    registerMutation.mutate({ eventId });
  };

  const continueLoading = tripsLoading || eventsLoading;
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-section">
        <TravelJourneyStrip activeStep="inspire" className="hidden md:block" />
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="md:hidden"
        >
          <CommunityStatsRow />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4 max-w-xl"
        >
          <h2 className="text-3xl font-bold md:hidden">
            {user?.firstName
              ? t("home.greetingNamed", { name: user.firstName })
              : t("home.greeting")}
          </h2>
          <div className="md:hidden">
            <HomeQuickActions hideSearch />
          </div>
        </motion.section>

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
        ) : (
          <>
            <HomeExplorePlannerSection places={places} trip={myTrip} waypoints={myTripWaypoints} />
            <HomeCommunityPreview useLiveData />
            <HomeMobileShowcase />

            {continueLoading ? (
              <div className="space-y-8" aria-busy="true">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TripCardSkeleton />
                  <TripCardSkeleton />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <EventCardSkeleton />
                  <EventCardSkeleton />
                </div>
              </div>
            ) : (
              <HomeContinue
                trips={trips}
                events={events}
                joinedTripIds={participations.tripIds}
                onJoinTrip={(id) => joinTripMutation.mutate(id)}
                onRegisterEvent={handleRegisterEvent}
                registeringEventId={registeringEventId}
                registeredEventIds={registrations.eventIds}
              />
            )}
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
