import PublicLayout from "@/components/public-layout";
import CinematicHero from "@/components/premium/CinematicHero";
import HeroStats from "@/components/home/hero-stats";
import HomeExplorePlannerSection from "@/components/home/home-explore-planner-section";
import HomeCommunityPreview from "@/components/home/home-community-preview";
import HomeMobileShowcase from "@/components/home/home-mobile-showcase";
import { ArrowRight } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { scrollToAnchor } from "@/lib/nav-config";

export function Landing() {
  const [, navigate] = useLocation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const t = window.setTimeout(() => scrollToAnchor(hash), 100);
      return () => window.clearTimeout(t);
    }
  }, []);

  return (
    <PublicLayout>
      <CinematicHero showSearch showAnchorPills />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        <section className="md:hidden">
          <HeroStats />
        </section>

        <HomeExplorePlannerSection places={[]} />
        <HomeCommunityPreview />
        <HomeMobileShowcase />

        <section className="max-w-3xl mx-auto text-center py-8">
          <h2 className="ait-section-title mb-6">Готовы к следующему приключению?</h2>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="ait-btn-glow rounded-2xl px-10 py-4 text-lg font-semibold text-white inline-flex items-center gap-2"
          >
            Начать бесплатно
            <ArrowRight className="h-5 w-5" />
          </button>
        </section>
      </div>
    </PublicLayout>
  );
}

export default Landing;
