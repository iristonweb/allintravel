import { type ActivityRingId } from "@shared/ait";
import { cn } from "@/lib/utils";
import { useAitRingLabels } from "@/hooks/useAitRingLabels";

const RING_ORDER: ActivityRingId[] = ["voice", "story", "echo", "pulse"];

const RING_COLORS: Record<ActivityRingId, string> = {
  voice: "stroke-[#8b5cf6]",
  story: "stroke-[#ff7a18]",
  echo: "stroke-[#22d3ee]",
  pulse: "stroke-[#34d399]",
};

type ActivityRingsProps = {
  rings: Record<string, { count: number; percent: number }>;
  compact?: boolean;
};

export default function ActivityRings({ rings, compact }: ActivityRingsProps) {
  const ringLabels = useAitRingLabels();

  return (
    <div className={cn("grid gap-3", compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4")}>
      {RING_ORDER.map((id) => {
        const r = rings[id] ?? { count: 0, percent: 0 };
        const size = compact ? 52 : 72;
        const stroke = compact ? 4 : 5;
        const radius = (size - stroke) / 2;
        const circ = 2 * Math.PI * radius;
        const offset = circ - (r.percent / 100) * circ;
        return (
          <div key={id} className="flex flex-col items-center gap-1.5">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className="stroke-white/10"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                className={RING_COLORS[id]}
                strokeWidth={stroke}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground text-center">
              {ringLabels[id]}
            </span>
            {!compact && (
              <span className="text-xs font-medium text-foreground/80">{r.count}/5</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
