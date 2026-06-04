import { motion, useScroll, useTransform } from "framer-motion";
import { Link } from "wouter";
import NextAdventureCard from "@/components/home/next-adventure-card";
import GlobalSearchPanel from "@/components/search/GlobalSearchPanel";
import HeroStats from "@/components/home/hero-stats";
import type { Trip } from "@shared/schema";
import { useRef } from "react";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=2400&q=90";

const ANCHOR_PILLS = [
  { href: "#explore", label: "Исследуй" },
  { href: "#community", label: "Сообщество" },
  { href: "#apps", label: "Приложения" },
] as const;

function scrollToAnchor(href: string) {
  const id = href.replace("#", "");
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

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
  const nextTrip = trips[0] ?? null;
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.85]);

  return (
    <section ref={ref} className="relative min-h-[100vh] flex flex-col">
      <motion.div className="absolute inset-0" style={{ y: imageY }}>
        <img
          src={HERO_IMAGE}
          alt="Путешествия — воздушные шары над горами"
          className="h-full w-full object-cover object-[center_35%] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050816]/70 via-[#050816]/35 to-transparent" />
        <div className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#8b5cf6]/20 blur-[120px] ait-ambient-orb" />
        <div className="absolute bottom-1/3 left-1/4 w-80 h-80 rounded-full bg-[#ff7a18]/15 blur-[100px] ait-ambient-orb" style={{ animationDelay: "-4s" }} />
      </motion.div>

      <motion.div className="relative z-10 flex-1 flex items-center" style={{ opacity: contentOpacity }}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 lg:pt-36 lg:pb-20">
          <div className="grid lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <h1 className="ait-text-hero text-white">
                Путешествуй.
                <br />
                Исследуй.
                <br />
                <span className="ait-gradient-text">Делись.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-slate-300 max-w-xl leading-relaxed">
                Интерактивный гид по лучшим местам мира. Планируй маршруты, находи вдохновение и
                делись впечатлениями.
              </p>
              {showAnchorPills && (
                <div className="mt-8 flex flex-wrap gap-2">
                  {ANCHOR_PILLS.map((pill) => (
                    <button
                      key={pill.href}
                      type="button"
                      onClick={() => scrollToAnchor(pill.href)}
                      className="rounded-full px-4 py-2 text-sm font-medium ait-glass border border-white/15 text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      {pill.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-10 flex flex-wrap gap-4">
                <Link href="/trips">
                  <motion.button
                    type="button"
                    className="ait-btn-glow rounded-2xl px-8 py-4 text-base font-semibold text-white"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Планировать путешествие
                  </motion.button>
                </Link>
                <Link href="/map">
                  <motion.button
                    type="button"
                    className="rounded-2xl px-8 py-4 text-base font-semibold text-white ait-glass border border-white/20 hover:bg-white/10 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Исследовать
                  </motion.button>
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
      </motion.div>

      <div className="relative z-10 hidden md:block px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full pb-8">
        <HeroStats />
      </div>

      {showSearch && (
        <motion.div
          className="relative z-20 -mt-8 mb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <div className="drop-shadow-[0_8px_32px_rgba(5,8,22,0.45)]">
            <GlobalSearchPanel />
          </div>
        </motion.div>
      )}
    </section>
  );
}
