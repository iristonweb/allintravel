import PublicLayout from "@/components/public-layout";
import CinematicHero from "@/components/premium/CinematicHero";
import HeroStats from "@/components/home/hero-stats";
import HomeExplorePlannerSection from "@/components/home/home-explore-planner-section";
import HomeCommunityPreview from "@/components/home/home-community-preview";
import HomeMobileShowcase from "@/components/home/home-mobile-showcase";
import PageMeta from "@/components/seo/PageMeta";
import { ArrowRight, Map, MapPin, BookOpen, Compass, Rocket } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { scrollToAnchor } from "@/lib/nav-config";
import { useTranslation } from "react-i18next";

export function Landing() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const timer = window.setTimeout(() => scrollToAnchor(hash), 100);
      return () => window.clearTimeout(timer);
    }
  }, []);

  return (
    <PublicLayout>
      <PageMeta path="/" />
      <CinematicHero showSearch showAnchorPills />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-24">
        <section className="max-w-3xl mx-auto text-center">
          <p className="text-lg text-slate-300 leading-relaxed">{t("landing.positioning")}</p>
        </section>

        <section className="md:hidden">
          <HeroStats />
        </section>

        <HomeExplorePlannerSection places={[]} />
        <HomeCommunityPreview />
        <HomeMobileShowcase />

        <section className="max-w-3xl mx-auto text-center py-8 space-y-6">
          <h2 className="ait-section-title">{t("landing.exploreNoSignup")}</h2>
          <p className="text-muted-foreground">{t("landing.exploreHint")}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" className="rounded-2xl gap-2" asChild>
              <Link href="/map">
                <Map className="h-4 w-4" />
                {t("nav.map")}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl gap-2" asChild>
              <Link href="/places">
                <MapPin className="h-4 w-4" />
                {t("nav.places")}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl gap-2" asChild>
              <Link href="/blog">
                <BookOpen className="h-4 w-4" />
                {t("nav.blog")}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl gap-2" asChild>
              <Link href="/destinations">
                <Compass className="h-4 w-4" />
                {t("nav.explore")}
              </Link>
            </Button>
            <Button variant="outline" className="rounded-2xl gap-2" asChild>
              <Link href="/nomad-hubs">
                <Rocket className="h-4 w-4" />
                {t("nav.nomadHubs")}
              </Link>
            </Button>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="ait-btn-glow rounded-2xl px-10 py-4 text-lg font-semibold text-white inline-flex items-center gap-2"
          >
            {t("landing.cta")}
            <ArrowRight className="h-5 w-5" />
          </button>
        </section>
      </div>
    </PublicLayout>
  );
}

export default Landing;
