import { motion } from "framer-motion";
import { Link } from "wouter";
import NextAdventureCard from "@/components/home/next-adventure-card";
import GlobalSearchPanel from "@/components/search/GlobalSearchPanel";
import type { Trip } from "@shared/schema";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=2400&q=85";

type CinematicHeroProps = {
  trips?: Trip[];
  showSearch?: boolean;
};

export default function CinematicHero({ trips = [], showSearch = true }: CinematicHeroProps) {
  const nextTrip = trips[0] ?? null;

  return (
    <section className="relative min-h-[100vh] flex flex-col">
      <div className="absolute inset-0">
        <img
          src={HERO_IMAGE}
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#050816]/95 via-[#050816]/75 to-[#050816]/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-transparent to-[#050816]/40" />
      </div>

      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-32">
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
      </div>

      {showSearch && (
        <motion.div
          className="relative z-20 -mt-8 mb-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
        >
          <GlobalSearchPanel />
        </motion.div>
      )}
    </section>
  );
}
