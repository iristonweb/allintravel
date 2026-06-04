import HomeSectionHeader from "@/components/home/home-section-header";
import InteractiveMap from "@/components/interactive-map";
import PlaceCard from "@/components/place-card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Place } from "@shared/schema";
import { Map, MapPin } from "lucide-react";
import { Link, useLocation } from "wouter";
import { usePlaceFavorites } from "@/hooks/usePlaceFavorites";

type HomeExploreProps = {
  places: Place[];
};

export default function HomeExplore({ places }: HomeExploreProps) {
  const [, navigate] = useLocation();
  const { isFavorite, toggleFavorite } = usePlaceFavorites();
  const placesPreview = places.slice(0, 6);

  return (
    <section className="space-y-6">
      <HomeSectionHeader
        title="Исследуйте места"
        description="Карта для обзора и подборка для быстрых решений"
        rightSlot={
          <Link href="/places">
            <Button variant="outline">
              <MapPin className="mr-2 h-4 w-4" />
              Все места
            </Button>
          </Link>
        }
      />

      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="map">
            <Map className="mr-2 h-4 w-4" />
            Карта
          </TabsTrigger>
          <TabsTrigger value="list">
            <MapPin className="mr-2 h-4 w-4" />
            Подборка
          </TabsTrigger>
        </TabsList>

        <TabsContent value="map" className="mt-6">
          <InteractiveMap
            places={places as any[]}
            onPlaceClick={(place) => navigate(`/place/${place.id}`)}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {placesPreview.length === 0 ? (
            <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
              Места пока не загрузились. Попробуйте открыть каталог.
              <div className="mt-3">
                <Link href="/places">
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    Открыть каталог
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {placesPreview.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  isFavorite={isFavorite(place.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

