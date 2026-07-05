import { Link } from "wouter";
import { Globe, MapPin, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import AitSurface from "@/components/ait-ui/AitSurface";
import { staggerContainer, staggerItem } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type TrendingWidgetItem = {
  id: string;
  name: string;
  count: number;
};

export type FeaturedGuideWidgetData = {
  title: string;
  imageSrc: string;
  href: string;
  badgeLabel: string;
};

type MapWidgetProps = {
  title: string;
  linkLabel: string;
  href: string;
  className?: string;
};

export function MapWidget({ title, linkLabel, href, className }: MapWidgetProps) {
  return (
    <AitSurface padding="none" radius="lg" className={cn("overflow-hidden", className)} hover>
      <div className="relative aspect-[16/10] bg-gradient-to-br from-ait-deep via-ait-navy to-ait-void">
        <div className="absolute inset-0 opacity-40">
          <svg viewBox="0 0 400 200" className="w-full h-full" aria-hidden>
            <ellipse cx="200" cy="100" rx="180" ry="80" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
            <circle cx="120" cy="90" r="6" fill="#ff7a18" className="ait-glow-pulse" />
            <circle cx="240" cy="70" r="4" fill="#8b5cf6" />
            <circle cx="280" cy="120" r="5" fill="#ff7a18" />
            <circle cx="160" cy="130" r="3" fill="#a855f7" />
          </svg>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
          <p className="text-sm font-semibold text-white">{title}</p>
          <Link href={href} className="text-xs text-ait-purple hover:text-ait-orange transition-colors">
            {linkLabel}
          </Link>
        </div>
      </div>
    </AitSurface>
  );
}

type TrendsWidgetProps = {
  title: string;
  items: TrendingWidgetItem[];
  className?: string;
};

export function TrendsWidget({ title, items, className }: TrendsWidgetProps) {
  if (!items.length) return null;

  return (
    <AitSurface padding="md" radius="lg" hover className={className}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-ait-orange" />
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <motion.li
            key={item.id}
            className="flex items-center justify-between gap-2 text-sm"
            whileHover={{ x: 2 }}
            transition={{ duration: 0.15 }}
          >
            <span className="flex items-center gap-2 min-w-0 text-slate-200 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-ait-purple" />
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{item.count}</span>
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
      <AitSurface padding="none" radius="lg" hover glow className={cn("overflow-hidden block", className)}>
        <div className="relative aspect-[4/3]">
          <img src={data.imageSrc} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-1.5 text-ait-orange text-xs font-bold uppercase mb-1">
              <Globe className="h-3.5 w-3.5" />
              {data.badgeLabel}
            </div>
            <p className="text-white font-semibold line-clamp-2">{data.title}</p>
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

export default function RightPanelWidgets({ map, trends, featured, footer, className }: RightPanelWidgetsProps) {
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
