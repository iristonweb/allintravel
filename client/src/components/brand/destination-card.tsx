import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

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
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-shrink-0 w-[200px] rounded-2xl overflow-hidden ait-glass text-left transition-transform hover:scale-[1.02]",
        className,
      )}
    >
      <div
        className="h-28 bg-cover bg-center"
        style={{ backgroundImage: `url('${destination.imageUrl}')` }}
      />
      <div className="p-3">
        <div className="font-semibold text-foreground">{destination.name}</div>
        <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
          {destination.placesCount != null && <span>{destination.placesCount} мест</span>}
          {destination.rating != null && (
            <span className="flex items-center gap-0.5 text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              {destination.rating}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
