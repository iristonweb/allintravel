import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { Trip } from "@shared/schema";
import { HERO_MAIN_SRC } from "@/lib/marketing-images";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

type CinematicHeroProps = {
  trips?: Trip[];
  showSearch?: boolean;
  showAnchorPills?: boolean;
};

/** First viewport: brand headline, one supporting line, CTAs, full-bleed visual. */
export default function CinematicHero(_props: CinematicHeroProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  return (
    <section ref={ref} className="relative min-h-[100svh] flex flex-col overflow-hidden">
      <motion.div className="absolute inset-0 z-0" style={{ y: imageY }}>
        <img
          src={HERO_MAIN_SRC}
          alt={t("marketing.hero.imageAlt")}
          className="h-full w-full object-cover object-[center_35%] scale-105"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#050816]/45 to-[#050816]/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050816]/75 via-[#050816]/25 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#8b5cf6]/20 blur-[120px] ait-ambient-orb" />
        <div
          className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-[#ff7a18]/15 blur-[100px] ait-ambient-orb"
          style={{ animationDelay: "-4s" }}
        />
      </motion.div>

      <div className="relative z-10 flex-1 flex items-end sm:items-center min-h-0">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-36 lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-ait-orange/90">
              All In Travel
            </p>
            <h1 className="ait-text-hero text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
              {t("marketing.hero.titleTravel")}
              <br />
              {t("marketing.hero.titleExplore")}
              <br />
              <span className="ait-gradient-text">{t("marketing.hero.titleShare")}</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-slate-100/95 max-w-xl leading-relaxed drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
              {t("marketing.hero.subtitle")}
            </p>
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
        </div>
      </div>
    </section>
  );
}
