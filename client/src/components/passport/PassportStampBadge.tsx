import { Link } from "wouter";
import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";

export type PassportStamp = {
  id: string;
  countryName: string;
  cityName: string | null;
  visitedAt: string | null;
  tripId?: string | null;
};

function countryInitials(countryName: string): string {
  const words = countryName.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return countryName.slice(0, 2).toUpperCase();
}

type PassportStampBadgeProps = {
  stamp: PassportStamp;
  className?: string;
};

function StampContent({ stamp }: { stamp: PassportStamp }) {
  const locationLabel = stamp.cityName
    ? `${stamp.cityName}, ${stamp.countryName}`
    : stamp.countryName;
  const dateLabel = stamp.visitedAt
    ? new Date(stamp.visitedAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ait-gradient-border bg-ait-deep/80 text-sm font-bold text-ait-purple">
        {countryInitials(stamp.countryName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground leading-snug truncate">{locationLabel}</p>
        {dateLabel && (
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mt-0.5">
            {dateLabel}
          </p>
        )}
      </div>
    </>
  );
}

const stampSurfaceClass =
  "flex items-center gap-3 ait-gradient-border transition-shadow duration-300";

export default function PassportStampBadge({ stamp, className }: PassportStampBadgeProps) {
  const inner = (
    <AitSurface padding="sm" radius="lg" hover className={cn(stampSurfaceClass, className)}>
      <StampContent stamp={stamp} />
    </AitSurface>
  );

  if (stamp.tripId) {
    return (
      <Link
        href={`/trips/${stamp.tripId}`}
        className="block rounded-card-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {inner}
      </Link>
    );
  }

  return inner;
}
