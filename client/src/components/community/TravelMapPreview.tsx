import { Link } from "wouter";
import { DEST_ICELAND_SRC } from "@/lib/marketing-images";
import { cn } from "@/lib/utils";

type TravelMapPreviewProps = {
  title: string;
  linkLabel: string;
  href: string;
  className?: string;
};

const FALLBACK_HOTSPOTS = [
  { top: "28%", left: "18%", size: "md" as const },
  { top: "34%", left: "46%", size: "sm" as const },
  { top: "42%", left: "62%", size: "lg" as const },
  { top: "52%", left: "78%", size: "md" as const },
  { top: "62%", left: "34%", size: "sm" as const },
  { top: "48%", left: "24%", size: "sm" as const },
  { top: "36%", left: "84%", size: "md" as const },
];

function DarkWorldMapPreview({ className }: { className?: string }) {
  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#07080f]", className)}>
      <img
        src={DEST_ICELAND_SRC}
        alt=""
        className="h-full w-full object-cover scale-150 opacity-35 brightness-[0.35] contrast-125 saturate-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#07080f]/80 via-[#0c0d18]/40 to-[#12131f]/90" />
      {FALLBACK_HOTSPOTS.map((spot, i) => (
        <span
          key={i}
          className={cn(
            "absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-ait-orange ait-glow-pulse",
            spot.size === "lg" && "h-3 w-3 shadow-[0_0_16px_rgba(255,122,24,0.85)]",
            spot.size === "md" && "h-2.5 w-2.5 shadow-[0_0_12px_rgba(255,122,24,0.7)]",
            spot.size === "sm" && "h-2 w-2 shadow-[0_0_10px_rgba(255,122,24,0.55)]",
          )}
          style={{ top: spot.top, left: spot.left }}
        />
      ))}
    </div>
  );
}

/** Compact travel map for the community right rail (~200px). */
export default function TravelMapPreview({
  title,
  linkLabel,
  href,
  className,
}: TravelMapPreviewProps) {
  return (
    <Link href={href} className={cn("block group", className)}>
      <div className="relative h-[200px] overflow-hidden rounded-card-lg border border-white/10 bg-ait-deep">
        <DarkWorldMapPreview className="h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent pointer-events-none" />
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
