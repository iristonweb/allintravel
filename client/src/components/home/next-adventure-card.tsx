import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MapPin, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Trip } from "@shared/schema";
import { DEST_ICELAND_SRC } from "@/lib/marketing-images";
import { resolveMediaUrl } from "@/lib/resolve-media-url";

type NextAdventureCardProps = {
  trip?: Trip | null;
  premium?: boolean;
};

const DEMO = {
  title: "Исландия",
  days: 12,
  locations: 8,
  progress: 60,
  imageUrl: DEST_ICELAND_SRC,
};

export default function NextAdventureCard({ trip, premium }: NextAdventureCardProps) {
  const title = trip?.title ?? DEMO.title;
  const progress = trip ? 45 : DEMO.progress;
  const coverUrl = trip?.imageUrl ? resolveMediaUrl(trip.imageUrl) : DEMO.imageUrl;
  const href = trip ? `/trips/${trip.id}` : "/trips";

  const Card = (
    <div
      className={
        premium
          ? "ait-glass-strong rounded-[28px] overflow-hidden ait-gradient-border shadow-2xl"
          : "ait-glass rounded-2xl overflow-hidden"
      }
    >
      <div
        className={premium ? "h-44 bg-cover bg-center relative" : "h-36 bg-cover bg-center"}
        style={{ backgroundImage: `url('${coverUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent" />
      </div>
      <div className="p-6 space-y-4">
        <div className="text-xs font-medium uppercase tracking-widest text-ait-purple">
          Следующее приключение
        </div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
        <div className="flex gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-ait-orange" />
            {DEMO.days} дней
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4 text-ait-cyan" />
            {DEMO.locations} локаций
          </span>
        </div>
        <div>
          <div className="flex justify-between text-xs text-slate-400 mb-2">
            <span>Планирование</span>
            <span className="text-white font-medium">{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#8b5cf6] [&>div]:to-[#ff7a18]"
          />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <div className="flex -space-x-2">
            {[11, 12, 13].map((i) => (
              <Avatar key={i} className="h-9 w-9 border-2 border-[#081224]">
                <AvatarImage src={`https://i.pravatar.cc/80?img=${i}`} />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <span className="text-xs text-slate-400">+3 в поездке</span>
        </div>
      </div>
    </div>
  );

  return (
    <Link href={href}>
      {premium ? (
        <motion.div
          whileHover={{ y: -6, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {Card}
        </motion.div>
      ) : (
        Card
      )}
    </Link>
  );
}
