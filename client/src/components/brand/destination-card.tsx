import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export type DestinationCardData = {
  id: string;
  name: string;
  imageUrl: string;
  placesCount?: number;
  rating?: number;
};

type DestinationCardProps = {
  destination: DestinationCardData;
  className?: string;
  onClick?: () => void;
};

export default function DestinationCard({ destination, className, onClick }: DestinationCardProps) {
  const { t } = useTranslation();

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.04, y: -4 }}
      className={cn(
        "flex-shrink-0 w-[220px] rounded-card-xl overflow-hidden text-left ait-glass-strong ait-surface-glow shadow-ait-elevation-2",
        className,
      )}
    >
      <div
        className="h-32 bg-cover bg-center relative"
        style={{ backgroundImage: `url('${destination.imageUrl}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] to-transparent" />
      </div>
      <div className="p-4">
        <div className="font-semibold text-white text-lg">{destination.name}</div>
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
          {destination.placesCount != null && (
            <span>{t("places.placesCount", { count: destination.placesCount })}</span>
          )}
          {destination.rating != null && (
            <span className="flex items-center gap-0.5 text-ait-gold">
              <Star className="h-3 w-3 fill-current" />
              {destination.rating}
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
