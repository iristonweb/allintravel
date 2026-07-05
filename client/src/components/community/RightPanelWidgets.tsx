import { Globe, MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import AitSurface from "@/components/ait-ui/AitSurface";
import TravelMapPreview from "@/components/community/TravelMapPreview";
import { formatTrendCount } from "@/lib/demo-reels-feed";
import { staggerContainer, staggerItem } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

export type TrendingWidgetItem = {
  id: string;
  name: string;
  count: number;
  flagEmoji?: string;
  countLabel?: string;
};

export type FeaturedGuideWidgetData = {
  title: string;
  imageSrc: string;
  href: string;
  badgeLabel: string;
  meta?: string;
};

type MapWidgetProps = {
  title: string;
  linkLabel: string;
  href: string;
  className?: string;
};

export function MapWidget({ title, linkLabel, href, className }: MapWidgetProps) {
  return <TravelMapPreview title={title} linkLabel={linkLabel} href={href} className={className} />;
}

type TrendsWidgetProps = {
  title: string;
  items: TrendingWidgetItem[];
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
};

export function TrendsWidget({
  title,
  items,
  viewAllHref,
  viewAllLabel,
  className,
}: TrendsWidgetProps) {
  const { t } = useTranslation();
  if (!items.length) return null;

  return (
    <AitSurface padding="md" radius="lg" hover className={className}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 min-w-0">
          <TrendingUp className="h-4 w-4 text-ait-orange shrink-0" />
          <h3 className="font-semibold text-sm truncate">{title}</h3>
        </div>
        {viewAllHref && viewAllLabel && (
          <Link
            href={viewAllHref}
            className="text-xs text-ait-purple hover:text-ait-orange transition-colors shrink-0"
          >
            {viewAllLabel}
          </Link>
        )}
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            className="flex items-center gap-3 text-sm"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.2 }}
          >
            <span className="w-4 text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
              {index + 1}
            </span>
            <span className="flex items-center gap-2 min-w-0 text-slate-200 truncate flex-1">
              {item.flagEmoji ? (
                <span className="text-base shrink-0" aria-hidden>
                  {item.flagEmoji}
                </span>
              ) : (
                <MapPin className="h-3.5 w-3.5 shrink-0 text-ait-purple" />
              )}
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {item.countLabel ??
                t("social.trendPostCount", {
                  count: formatTrendCount(item.count),
                  defaultValue: "{{count}} posts",
                })}
            </span>
          </motion.li>
        ))}
      </ul>
    </AitSurface>
  );
}

type FeaturedGuideWidgetProps = {
  data: FeaturedGuideWidgetData;
  className?: string;
};

export function FeaturedGuideWidget({ data, className }: FeaturedGuideWidgetProps) {
  return (
    <Link href={data.href}>
      <AitSurface
        padding="none"
        radius="lg"
        hover
        glow
        className={cn("overflow-hidden block", className)}
      >
        <div className="relative aspect-[4/3]">
          <img src={data.imageSrc} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1.5 text-ait-orange text-xs font-bold uppercase tracking-wider mb-1">
              <Globe className="h-3.5 w-3.5" />
              {data.badgeLabel}
            </div>
            <p className="text-white font-semibold line-clamp-2">{data.title}</p>
            {data.meta && <p className="text-xs text-white/70 mt-1">{data.meta}</p>}
          </div>
        </div>
      </AitSurface>
    </Link>
  );
}

type RightPanelWidgetsProps = {
  map: MapWidgetProps;
  trends?: TrendsWidgetProps;
  featured?: FeaturedGuideWidgetData;
  footer?: ReactNode;
  className?: string;
};

export default function RightPanelWidgets({
  map,
  trends,
  featured,
  footer,
  className,
}: RightPanelWidgetsProps) {
  return (
    <motion.div
      className={cn("space-y-6", className)}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={staggerItem}>
        <MapWidget {...map} />
      </motion.div>
      {trends && (
        <motion.div variants={staggerItem}>
          <TrendsWidget {...trends} />
        </motion.div>
      )}
      {featured && (
        <motion.div variants={staggerItem}>
          <FeaturedGuideWidget data={featured} />
        </motion.div>
      )}
      {footer && <motion.div variants={staggerItem}>{footer}</motion.div>}
    </motion.div>
  );
}
