import Hero from "@/components/marketing/Hero";
import GradientButton from "@/components/brand/gradient-button";
import NextAdventureCard from "@/components/home/next-adventure-card";
import HeroStats from "@/components/home/hero-stats";
import { Link } from "wouter";
import type { Trip } from "@shared/schema";

type HeroSectionProps = {
  trips?: Trip[];
};

export function HeroSection({ trips = [] }: HeroSectionProps) {
  const nextTrip = trips[0] ?? null;

  return (
    <Hero
      title={
        <>
          Путешествуй. Исследуй.{" "}
          <span className="ait-gradient-text">Делись.</span>
        </>
      }
      subtitle="Интерактивный гид для путешественников: карта, маршруты, сообщество и планирование в одном тёмном премиальном интерфейсе."
      actions={
        <>
          <Link href="/trips">
            <GradientButton>Планировать путешествие</GradientButton>
          </Link>
          <Link href="/map">
            <GradientButton outline>Исследовать</GradientButton>
          </Link>
        </>
      }
      aside={<NextAdventureCard trip={nextTrip} />}
      stats={<HeroStats />}
      backgroundImageUrl="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=2400&q=70"
      className="py-14 sm:py-16 lg:py-20 -mx-4 px-0 sm:mx-0"
    />
  );
}

export default HeroSection;
