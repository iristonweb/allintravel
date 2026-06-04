import { Button } from "@/components/ui/button";
import Hero from "@/components/marketing/Hero";
import FloatingSearchBar from "@/components/search/FloatingSearchBar";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "wouter";

export function HeroSection() {
  return (
    <Hero
      title={
        <>
          Откройте мир{" "}
          <span className="bg-gradient-to-r from-[var(--ait-primary)] to-[var(--ait-accent)] bg-clip-text text-transparent">
            вместе
          </span>
        </>
      }
      subtitle="Исследуйте места, планируйте поездки и держите всё важное под рукой — без перегруженных интерфейсов."
      actions={
        <>
          <Link href="/places">
            <Button variant="premium" size="cta" className="w-full sm:w-auto">
              <MapPin className="mr-1" />
              Исследовать места
              <ArrowRight className="ml-1" />
            </Button>
          </Link>
        </>
      }
      below={<FloatingSearchBar className="mt-2" />}
      backgroundImageUrl="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=2400&q=70"
      className="py-14 sm:py-16 lg:py-20"
    />
  );
}

export default HeroSection;