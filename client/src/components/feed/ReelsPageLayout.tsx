import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/ait-motion";
import { motion } from "framer-motion";
import { forwardRef, type HTMLAttributes, type ReactNode, type RefObject } from "react";

type ReelsPageLayoutProps = {
  header?: ReactNode;
  stats?: ReactNode;
  stories?: ReactNode;
  tabs?: ReactNode;
  filters?: ReactNode;
  toolbar?: ReactNode;
  composer?: ReactNode;
  feed: ReactNode;
  className?: string;
};

function AnimatedSlot({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      custom={delay}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

/** Center-column shell for the Reels / Social Feed page (presentation only). */
export default function ReelsPageLayout({
  header,
  stats,
  stories,
  tabs,
  filters,
  toolbar,
  composer,
  feed,
  className,
}: ReelsPageLayoutProps) {
  return (
    <div className={cn("space-y-4 md:space-y-5", className)}>
      {header && <AnimatedSlot delay={0}>{header}</AnimatedSlot>}
      {tabs && <AnimatedSlot delay={0.04}>{tabs}</AnimatedSlot>}
      {filters && <AnimatedSlot delay={0.06}>{filters}</AnimatedSlot>}
      {toolbar && <AnimatedSlot delay={0.08}>{toolbar}</AnimatedSlot>}
      {stats && <AnimatedSlot delay={0.1}>{stats}</AnimatedSlot>}
      {stories && <AnimatedSlot delay={0.12}>{stories}</AnimatedSlot>}
      {composer && <AnimatedSlot delay={0.14}>{composer}</AnimatedSlot>}
      <AnimatedSlot delay={0.16} className="min-h-0">
        {feed}
      </AnimatedSlot>
    </div>
  );
}

type ReelsSnapFeedProps = {
  children: ReactNode;
  className?: string;
  onScroll?: () => void;
  containerRef?: RefObject<HTMLDivElement>;
};

/** Vertical scroll-snap container for full-height Reel cards. */
export function ReelsSnapFeed({ children, className, onScroll, containerRef }: ReelsSnapFeedProps) {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className={cn(
        "h-[calc(100dvh-var(--ait-header-h,4.5rem)-9.5rem)]",
        "sm:h-[calc(100dvh-var(--ait-header-h,4.5rem)-11rem)]",
        "lg:h-[calc(100dvh-var(--ait-header-h,4.5rem)-13rem)]",
        "min-h-[min(68dvh,480px)]",
        "max-h-[900px]",
        "overflow-y-auto snap-y snap-mandatory scrollbar-hide overscroll-y-contain",
        "[-webkit-overflow-scrolling:touch]",
        "rounded-card-xl bg-ait-deep/50 ring-1 ring-white/5",
        className,
      )}
    >
      {children}
    </div>
  );
}

type ReelsSnapItemProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
};

/** Single snap page inside {@link ReelsSnapFeed}. */
export const ReelsSnapItem = forwardRef<HTMLDivElement, ReelsSnapItemProps>(
  ({ children, className, ...props }, ref) => (
    <div ref={ref} className={cn("h-full snap-start snap-always shrink-0", className)} {...props}>
      {children}
    </div>
  ),
);
ReelsSnapItem.displayName = "ReelsSnapItem";
