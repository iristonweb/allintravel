import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import InteractiveMap from "@/components/interactive-map";
import DestinationCard from "@/components/brand/destination-card";
import HomeSectionHeader from "@/components/home/home-section-header";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Place } from "@shared/schema";

const showcaseDestinations = [
  {
    id: "bali",
    name: "Бали",
    imageUrl: "https://images.unsplash.com/photo-1537996195241-795aa0a07e0f?w=500&q=85",
    placesCount: 342,
    rating: 4.8,
  },
  {
    id: "iceland",
    name: "Исландия",
    imageUrl: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=500&q=85",
    placesCount: 128,
    rating: 4.9,
  },
  {
    id: "peru",
    name: "Перу",
    imageUrl: "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=500&q=85",
    placesCount: 156,
    rating: 4.7,
  },
  {
    id: "italy",
    name: "Италия",
    imageUrl: "https://images.unsplash.com/photo-1516483638260-f4dbaf9a9346?w=500&q=85",
    placesCount: 412,
    rating: 4.9,
  },
  {
    id: "japan",
    name: "Япония",
    imageUrl: "https://images.unsplash.com/photo-1493976040374-85c8e912f437?w=500&q=85",
    placesCount: 276,
    rating: 4.9,
  },
];

type HomeMapSectionProps = {
  places: Place[];
};

export default function HomeMapSection({ places }: HomeMapSectionProps) {
  const [, navigate] = useLocation();

  const mapPlaces = places
    .filter((p) => p.latitude != null && p.longitude != null)
    .slice(0, 30)
    .map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type ?? undefined,
      latitude: p.latitude,
      longitude: p.longitude,
      averageRating: p.averageRating,
      priceRange: p.priceRange,
      address: p.address,
    }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="space-y-6"
    >
      <HomeSectionHeader
        title="Интерактивная карта мира"
        description="Отели, рестораны, активности и маршруты — с живыми маркерами и перелётами"
        rightSlot={
          <Link href="/map">
            <Button variant="glass" size="sm">
              Открыть карту
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        }
      />

      <div className="relative rounded-[32px] overflow-hidden ait-gradient-border shadow-2xl min-h-[480px] md:min-h-[560px]">
        <InteractiveMap
          places={mapPlaces}
          fullHeight
          showDemoMarkers
          onPlaceClick={(place) => navigate(`/place/${place.id}`)}
        />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#050816] to-transparent pointer-events-none z-[999]" />
        <div className="absolute bottom-6 left-0 right-0 z-[1000] px-4 pointer-events-none">
          <div className="pointer-events-auto flex gap-4 overflow-x-auto pb-2 snap-x scrollbar-hide">
            {showcaseDestinations.map((d) => (
              <DestinationCard
                key={d.id}
                destination={d}
                className="snap-start"
                onClick={() => navigate("/map")}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
