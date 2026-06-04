import AppLayout from "@/components/app-layout";
import CinematicHero from "@/components/premium/CinematicHero";
import FeatureFooter from "@/components/marketing/feature-footer";
import HomeContinue from "@/components/home/home-continue";
import HomePersonalized from "@/components/home/home-personalized";
import HomeQuickActions from "@/components/home/home-quick-actions";
import HomeMapSection from "@/components/home/home-map-section";
import HomePlannerSection from "@/components/home/home-planner-section";
import HomeCommunityPreview from "@/components/home/home-community-preview";
import HomeMobileShowcase from "@/components/home/home-mobile-showcase";
import HomeCommunity from "@/components/home/home-community";
import HeroStats from "@/components/home/hero-stats";
import DestinationCard from "@/components/brand/destination-card";
import GlassCard from "@/components/brand/glass-card";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Place, Trip, Event, User } from "@shared/schema";
import { Link } from "wouter";
import { motion } from "framer-motion";

const popularDestinations = [
  {
    id: "ch",
    name: "Швейцария",
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5fd1b6d00b1?w=500&q=85",
    placesCount: 89,
    rating: 4.9,
  },
  {
    id: "no",
    name: "Норвегия",
    imageUrl: "https://images.unsplash.com/photo-1518837695005-2083099ee35b?w=500&q=85",
    placesCount: 96,
    rating: 4.8,
  },
  {
    id: "jp",
    name: "Япония",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e912f437?w=500&q=85",
    placesCount: 276,
    rating: 4.9,
  },
];

export function Home() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 30 }],
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips", { limit: 4 }],
  });

  const { data: participations = { tripIds: [] as string[] } } = useQuery<{ tripIds: string[] }>({
    queryKey: ["/api/trips/my-participations"],
    enabled: isAuthenticated,
  });

  const joinTripMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const res = await apiRequest("POST", `/api/trips/${tripId}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/trips/my-participations"] });
      toast({ title: "Вы присоединились к поездке" });
    },
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", { upcoming: true, limit: 4 }],
  });

  const { data: friends = [] } = useQuery<User[]>({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const myTrip = trips[0];

  return (
    <AppLayout immersive contentClassName="p-0">
      <CinematicHero trips={trips} />

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
            {user?.firstName ? `Привет, ${user.firstName}!` : "Привет!"}
          </h2>
          <HomeQuickActions />
        </motion.section>

        <HomeMapSection places={places} />
        <HomePlannerSection trip={myTrip} />
        <HomeCommunityPreview />

        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-4"
        >
          <h2 className="ait-section-title">Популярные направления</h2>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 snap-x scrollbar-hide">
            {popularDestinations.map((d) => (
              <DestinationCard key={d.id} destination={d} className="snap-start" />
            ))}
          </div>
        </motion.section>

        {myTrip && (
          <section className="md:hidden">
            <h3 className="font-semibold mb-3 text-lg">Мои поездки</h3>
            <Link href={`/trips/${myTrip.id}`}>
              <GlassCard className="p-5 ait-gradient-border" hover>
                <div className="font-semibold text-lg">{myTrip.title}</div>
                <p className="text-sm text-muted-foreground">{myTrip.destination}</p>
                <Progress value={60} className="mt-4 h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#8b5cf6] [&>div]:to-[#ff7a18]" />
              </GlassCard>
            </Link>
          </section>
        )}

        <HomeContinue
          trips={trips}
          events={events}
          joinedTripIds={participations.tripIds}
          onJoinTrip={(id) => joinTripMutation.mutate(id)}
        />
        <HomePersonalized />
        <HomeCommunity friendsCount={friends.length} />
        <HomeMobileShowcase />
      </div>

      <FeatureFooter />
    </AppLayout>
  );
}

export default Home;
