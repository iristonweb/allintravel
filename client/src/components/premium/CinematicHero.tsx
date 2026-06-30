import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import NextAdventureCard from "@/components/home/next-adventure-card";
import GlobalSearchPanel from "@/components/search/GlobalSearchPanel";
import HeroStats from "@/components/home/hero-stats";
import type { Trip } from "@shared/schema";
import { HERO_MAIN_SRC } from "@/lib/marketing-images";
import { useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { scrollToAnchor } from "@/lib/nav-config";

type CinematicHeroProps = {
  trips?: Trip[];
  showSearch?: boolean;
  showAnchorPills?: boolean;
};

export default function CinematicHero({
  trips = [],
  showSearch = true,
  showAnchorPills = false,
}: CinematicHeroProps) {
  const { t } = useTranslation();
  const nextTrip = trips[0] ?? null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const anchorPills = useMemo(
    () => [
      { href: "#explore", label: t("nav.explore") },
      { href: "#community", label: t("nav.community") },
      { href: "#apps", label: t("nav.apps") },
    ],
    [t],
  );

  return (
    <section ref={ref} className="relative min-h-[100svh] flex flex-col overflow-hidden">
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        <img
          src={HERO_MAIN_SRC}
          alt={t("marketing.hero.imageAlt")}
          className="h-full w-full object-cover object-[center_35%] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050816]/70 via-[#050816]/35 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#8b5cf6]/20 blur-[120px] ait-ambient-orb" />
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-[#ff7a18]/15 blur-[100px] ait-ambient-orb"
          style={{ animationDelay: "-4s" }}
        />
      </motion.div>

      <div className="relative z-10 flex-1 flex items-center min-h-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8 lg:pt-36 lg:pb-12">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="ait-text-hero text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
                {t("marketing.hero.titleTravel")}
                <br />
                {t("marketing.hero.titleExplore")}
                <br />
                <span className="ait-gradient-text">{t("marketing.hero.titleShare")}</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-100 max-w-xl leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
                {t("marketing.hero.subtitle")}
              </p>
              {showAnchorPills && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {anchorPills.map((pill) => (
                    <button
                      key={pill.href}
                      type="button"
                      onClick={() => scrollToAnchor(pill.href)}
                      className="rounded-full px-4 py-2 text-sm font-medium ait-glass border border-white/15 text-slate-200 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/trips">
                  <Button
                    variant="premium"
                    size="lg"
                    className="rounded-2xl px-8 py-4 text-base font-semibold"
                  >
                    {t("marketing.hero.planTrip")}
                  </Button>
                </Link>
                <Link href="/map">
                  <Button
                    variant="glass"
                    size="lg"
                    className="rounded-2xl px-8 py-4 text-base font-semibold text-white border border-white/20"
                  >
                    {t("marketing.hero.explore")}
                  </Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="hidden lg:block"
            >
              <NextAdventureCard trip={nextTrip} premium />
            </motion.div>
          </div>
        </div>
      </div>

      <div className="relative z-20 mt-auto w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 lg:pb-14 flex flex-col gap-6">
          <div className="hidden md:block">
            <HeroStats />
          </div>
          {showSearch && (
            <motion.div
              className="w-full max-w-6xl mx-auto"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6 }}
            >
              <GlobalSearchPanel />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
}
