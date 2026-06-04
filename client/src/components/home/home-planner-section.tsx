import { motion } from "framer-motion";
import { Link } from "wouter";
import GlassCard from "@/components/brand/glass-card";
import TravelMap from "@/components/maps/TravelMap";
import { Calendar, MapPin, Route, Sparkles } from "lucide-react";
import type { Trip } from "@shared/schema";

const DEMO_DAYS = [
  {
    day: 1,
    title: "Рейкьявик",
    image: "https://images.unsplash.com/photo-1529963188137-1429c77ce9bf?w=200&q=80",
    stops: ["Хаттегримскиркья", "Солнечный путешественник"],
  },
  {
    day: 2,
    title: "Золотое кольцо",
    image: "https://images.unsplash.com/photo-1504829857797-ddff29c27927?w=200&q=80",
    stops: ["Гейсир", "Гулльфосс"],
  },
  {
    day: 3,
    title: "Южный берег",
    image: "https://images.unsplash.com/photo-1518837695005-2083099ee35b?w=200&q=80",
    stops: ["Сельяландсфосс", "Скóгафосс"],
  },
  {
    day: 4,
    title: "Лагуна Йёкюльсаурлон",
    image: "https://images.unsplash.com/photo-1531168556467-80abfa572935?w=200&q=80",
    stops: ["Айсберги", "Алмазный пляж"],
  },
];

const DEMO_ROUTE = [
  { id: "1", name: "Рейкьявик", latitude: 64.1466, longitude: -21.9426, type: "attraction" },
  { id: "2", name: "Гейсир", latitude: 64.31, longitude: -20.3, type: "attraction" },
  { id: "3", name: "Сельяландсфосс", latitude: 63.6156, longitude: -19.9886, type: "attraction" },
  { id: "4", name: "Йёкюльсаурлон", latitude: 64.0484, longitude: -16.2304, type: "attraction" },
];

type HomePlannerSectionProps = {
  trip?: Trip | null;
};

export default function HomePlannerSection({ trip }: HomePlannerSectionProps) {
  const href = trip ? `/trips/${trip.id}` : "/trips";

  return (
    <motion.section
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="ait-section-title">
            Планировщик{" "}
            <span className="ait-gradient-text">путешествий</span>
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Маршруты по дням, карта с точками и AI-оптимизация — как в мокапе
          </p>
        </div>
        <Link href={href}>
          <span className="text-sm text-ait-purple hover:text-white transition-colors font-medium">
            Открыть планировщик →
          </span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-[300px_1fr] gap-4 min-h-[480px]">
        <GlassCard strong className="p-4 overflow-y-auto max-h-[520px] space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-ait-purple mb-2">
            <Route className="h-4 w-4" />
            {trip?.title ?? "Исландия 2026"}
          </div>
          {DEMO_DAYS.map((d) => (
            <motion.div
              key={d.day}
              whileHover={{ x: 4 }}
              className="flex gap-3 p-3 rounded-2xl border border-white/8 bg-white/[0.03] cursor-pointer hover:border-ait-purple/30 transition-colors"
            >
              <div
                className="w-14 h-14 rounded-xl bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url('${d.image}')` }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-ait-orange">День {d.day}</div>
                <div className="font-semibold text-sm truncate">{d.title}</div>
                <ul className="mt-1 space-y-0.5">
                  {d.stops.map((s) => (
                    <li key={s} className="text-xs text-muted-foreground truncate">
                      • {s}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </GlassCard>

        <GlassCard strong className="p-0 overflow-hidden min-h-[420px] ait-gradient-border relative">
          <TravelMap
            places={DEMO_ROUTE}
            showRoute
            height="100%"
            className="h-full min-h-[420px] rounded-[24px]"
          />
        </GlassCard>
      </div>

      <GlassCard strong className="px-5 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-ait-purple" />
            <strong className="text-white">12</strong> дней
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-ait-orange" />
            <strong className="text-white">8</strong> локаций
          </span>
          <span>
            <strong className="text-white">1240</strong>{" "}
            <span className="text-muted-foreground">км</span>
          </span>
          <span>
            <strong className="text-ait-gold">$2,450</strong>{" "}
            <span className="text-muted-foreground">бюджет</span>
          </span>
        </div>
        <Link href={href}>
          <span className="ait-btn-glow rounded-2xl px-6 py-3 text-sm font-semibold text-white inline-flex items-center gap-2 cursor-pointer hover:opacity-95 transition-opacity">
            <Sparkles className="h-4 w-4" />
            Оптимизировать маршрут
          </span>
        </Link>
      </GlassCard>
    </motion.section>
  );
}
