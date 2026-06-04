import AppLayout from "@/components/app-layout";
import HeroSection from "@/components/hero-section";
import HomeContinue from "@/components/home/home-continue";
import HomeExplore from "@/components/home/home-explore";
import HomeCommunity from "@/components/home/home-community";
import HomeTrustStrip from "@/components/home/home-trust-strip";
import HomeQuickActions from "@/components/home/home-quick-actions";
import HomePersonalized from "@/components/home/home-personalized";
import HomeSimilar from "@/components/home/home-similar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Place, Trip, Event, User } from "@shared/schema";

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
    onSuccess: (_, tripId) => {
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

  return (
    <AppLayout contentClassName="px-0 py-0">
      <HeroSection />

      <div className="container mx-auto px-4 py-10 space-y-14">
        <section className="space-y-4 pt-2">
          <h2 className="text-2xl md:text-3xl font-bold">
            {user?.firstName ? `Добро пожаловать, ${user.firstName}!` : "Добро пожаловать!"}
          </h2>
          <p className="text-muted-foreground max-w-3xl">
            Начните с поиска мест, добавляйте их в маршрут, находите попутчиков и общайтесь с сообществом.
          </p>
        </section>

        <HomeTrustStrip />

        <HomeQuickActions />

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
    </AppLayout>
  );
}

export default Home;
