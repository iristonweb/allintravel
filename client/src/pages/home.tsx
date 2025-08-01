import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import NavigationHeader from "@/components/navigation-header";
import HeroSection from "@/components/hero-section";
import InteractiveMap from "@/components/interactive-map";
import PlaceCard from "@/components/place-card";
import TravelCompanionCard from "@/components/travel-companion-card";
import ReviewCard from "@/components/review-card";
import ChatComponent from "@/components/chat-component";
import EventCard from "@/components/event-card";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: places, isLoading: placesLoading, error: placesError } = useQuery({
    queryKey: ["/api/places"],
    enabled: isAuthenticated,
  });

  const { data: trips, isLoading: tripsLoading } = useQuery({
    queryKey: ["/api/trips"],
    enabled: isAuthenticated,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["/api/events", { upcoming: true }],
    enabled: isAuthenticated,
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (placesError && isUnauthorizedError(placesError as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [placesError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <NavigationHeader />
      <HeroSection />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{places?.length || 0}</div>
            <div className="text-gray-600">Places</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary">15,234</div>
            <div className="text-gray-600">Reviews</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent">8,956</div>
            <div className="text-gray-600">Travelers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">127</div>
            <div className="text-gray-600">Countries</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs defaultValue="all" className="mb-8">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="restaurant">Restaurants</TabsTrigger>
            <TabsTrigger value="hotel">Hotels</TabsTrigger>
            <TabsTrigger value="attraction">Attractions</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {/* Interactive Map */}
            <div className="mb-12">
              <InteractiveMap places={places || []} />
            </div>

            {/* Featured Places */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Featured Places</h2>
                <Button variant="outline">View all</Button>
              </div>

              {placesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="bg-gray-200 rounded-xl h-64 animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {places?.slice(0, 8).map((place) => (
                    <PlaceCard key={place.id} place={place} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="restaurant">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places?.filter(p => p.type === 'restaurant').map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="hotel">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places?.filter(p => p.type === 'hotel').map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="attraction">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {places?.filter(p => p.type === 'attraction').map((place) => (
                <PlaceCard key={place.id} place={place} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-200 rounded-xl h-48 animate-pulse"></div>
                ))
              ) : (
                events?.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Travel Companions Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Find Travel Companions</h2>
            <Button className="bg-primary text-white hover:bg-primary/90">
              Post Trip
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tripsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-gray-200 rounded-xl h-40 animate-pulse"></div>
              ))
            ) : (
              trips?.slice(0, 3).map((trip) => (
                <TravelCompanionCard key={trip.id} trip={trip} />
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Reviews</h2>
            <Button variant="outline">View all reviews</Button>
          </div>

          <div className="space-y-6">
            <ReviewCard />
            <ReviewCard />
          </div>
        </div>

        {/* Community Chat */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Community Chat</h2>
            <Button variant="outline">Join conversation</Button>
          </div>
          <ChatComponent />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="text-primary text-2xl mr-2">🌍</div>
                <span className="text-xl font-bold text-gray-900">All In Travel</span>
              </div>
              <p className="text-gray-600 mb-4">
                Your ultimate companion for discovering amazing places, connecting with fellow travelers, and creating unforgettable memories around the world.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Explore</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Popular Destinations</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Top Restaurants</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Best Hotels</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Travel Guides</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-600 hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-8 mt-8">
            <p className="text-gray-600 text-sm text-center">© 2024 All In Travel. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
