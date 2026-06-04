import AppLayout from "@/components/app-layout";
import HeroSection from "@/components/hero-section";
import HomeContinue from "@/components/home/home-continue";
import HomeExplore from "@/components/home/home-explore";
import HomeCommunity from "@/components/home/home-community";
import FeatureFooter from "@/components/marketing/feature-footer";
import HomeQuickActions from "@/components/home/home-quick-actions";
import HomePersonalized from "@/components/home/home-personalized";
import HomeSimilar from "@/components/home/home-similar";
import DestinationCard from "@/components/brand/destination-card";
import GlassCard from "@/components/brand/glass-card";
import { Progress } from "@/components/ui/progress";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Place, Trip, Event, User } from "@shared/schema";
import { Link } from "wouter";

const popularDestinations = [
  {
    id: "ch",
    name: "Швейцария",
    imageUrl: "https://images.unsplash.com/photo-1530122037265-a5fd1b6d00b1?w=400&q=80",
    placesCount: 89,
    rating: 4.9,
  },
];

export function Home() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["/api/places", { limit: 6 }],
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
      toast({ title: "Вы присоединились!", description: "Вы добавлены в список участников поездки." });
    },
    onError: () => {
      toast({ title: "Ошибка", description: "Не удалось присоединиться к поездке.", variant: "destructive" });
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
    <AppLayout contentClassName="px-0 py-0">
      <HeroSection trips={trips} />

      <div className="container mx-auto px-4 py-10 space-y-14">
        <section className="space-y-4 md:hidden">
          <h2 className="text-2xl font-bold">
            {user?.firstName ? `Привет, ${user.firstName}!` : "Привет!"}
          </h2>
          <HomeQuickActions />
        </section>

        <section className="md:hidden space-y-3">
          <h3 className="font-semibold">Популярные направления</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {popularDestinations.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </section>

        {myTrip && (
          <section className="md:hidden">
            <h3 className="font-semibold mb-3">Мои поездки</h3>
            <Link href={`/trips/${myTrip.id}`}>
              <GlassCard className="p-4">
                <div className="font-medium">{myTrip.title}</div>
                <p className="text-sm text-muted-foreground">{myTrip.destination}</p>
                <Progress value={55} className="mt-3 h-2 bg-white/10 [&>div]:bg-ait-gradient-cta" />
                <p className="text-xs text-muted-foreground mt-1">55% запланировано</p>
              </GlassCard>
            </Link>
          </section>
        )}

        <section className="hidden md:block space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            {user?.firstName ? `Добро пожаловать, ${user.firstName}!` : "Добро пожаловать!"}
          </h2>
          <HomeQuickActions />
        </section>

        <HomeContinue
          trips={trips}
          events={events}
          joinedTripIds={participations.tripIds}
          onJoinTrip={(id) => joinTripMutation.mutate(id)}
        />

        <HomePersonalized />

        <HomeSimilar />

        <HomeExplore places={places} />

        <HomeCommunity friendsCount={friends.length} />
      </div>

      <FeatureFooter />
    </AppLayout>
  );
}

export default Home;
