import { Link } from "wouter";
import TravelMap from "@/components/maps/TravelMap";
import { DEST_ICELAND_SRC } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

type TravelMapPreviewProps = {
  title: string;
  linkLabel: string;
  href: string;
  className?: string;
};

const FALLBACK_HOTSPOTS = [
  { top: "38%", left: "22%", variant: "orange" as const },
  { top: "32%", left: "48%", variant: "purple" as const },
  { top: "55%", left: "68%", variant: "orange" as const },
  { top: "28%", left: "72%", variant: "green" as const },
];

function StaticMapFallback({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-ait-deep", className)}>
      <img src={DEST_ICELAND_SRC} alt="" className="h-full w-full object-cover opacity-70" />
      <div className="absolute inset-0 bg-gradient-to-br from-ait-deep/50 via-transparent to-ait-navy/60" />
      {FALLBACK_HOTSPOTS.map((spot, i) => (
        <span
          key={i}
          className={cn(
            "absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ait-glow-pulse",
            spot.variant === "orange" && "bg-ait-orange shadow-[0_0_12px_rgba(255,122,24,0.7)]",
            spot.variant === "purple" && "bg-ait-purple shadow-[0_0_12px_rgba(139,92,246,0.7)]",
            spot.variant === "green" && "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]",
          )}
          style={{ top: spot.top, left: spot.left }}
        />
      ))}
    </div>
  );
}

const hasMapProvider = Boolean(
  import.meta.env.VITE_MAPBOX_TOKEN || import.meta.env.VITE_YANDEX_MAPS_API_KEY,
);

/** Compact travel map for the community right rail (~200px). */
export default function TravelMapPreview({
  title,
  linkLabel,
  href,
  className,
}: TravelMapPreviewProps) {
  return (
    <Link href={href} className={cn("block group", className)}>
      <div className="relative h-[200px] overflow-hidden rounded-card-lg border border-white/10">
        {hasMapProvider ? (
          <TravelMap
            showDemoMarkers
            compact
            height="200px"
            className="h-full w-full pointer-events-none"
          />
        ) : (
          <StaticMapFallback />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 p-4 pointer-events-none">
          <p className="text-sm font-semibold text-white">{title}</p>
          <span className="text-xs text-ait-purple group-hover:text-ait-orange transition-colors duration-200">
            {linkLabel}
          </span>
        </div>
      </div>
    </Link>
  );
}
