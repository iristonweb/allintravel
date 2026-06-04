import CinematicHero from "@/components/premium/CinematicHero";
import type { Trip } from "@shared/schema";

type HeroSectionProps = {
  trips?: Trip[];
};

export function HeroSection({ trips = [] }: HeroSectionProps) {
  return <CinematicHero trips={trips} />;
}

export default HeroSection;
