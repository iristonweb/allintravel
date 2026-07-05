import { Link } from "wouter";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, scaleTap } from "@/lib/ait-motion";
import AitAvatarRing from "@/components/ait-ui/AitAvatarRing";
import type { ReactNode } from "react";

export type StoryStripItem = {
  id: string;
  label: string;
  avatarSrc?: string | null;
  fallback: string;
  /** When true, shows gradient ring (unviewed). */
  unviewed?: boolean;
};

type StoriesStripProps = {
  createLabel: string;
  yourStoryAvatar: { src?: string | null; fallback: string };
  items: StoryStripItem[];
  onCreateClick?: () => void;
  createAction?: ReactNode;
  onItemClick?: (item: StoryStripItem) => void;
  className?: string;
};

export default function StoriesStrip({
  createLabel,
  yourStoryAvatar,
  items,
  onCreateClick,
  createAction,
  onItemClick,
  className,
}: StoriesStripProps) {
  return (
    <div className={cn("mb-section", className)}>
      <motion.div
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide touch-pan-x"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem} className="snap-start shrink-0">
          {createAction ?? (
            <button
              type="button"
              onClick={onCreateClick}
              className="flex flex-col items-center gap-2 group w-[68px] sm:w-[72px]"
            >
              <motion.div className="relative" {...scaleTap}>
                <AitAvatarRing
                  src={yourStoryAvatar.src}
                  fallback={yourStoryAvatar.fallback}
                  size="lg"
                  active={false}
                />
                <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full ait-btn-glow border-2 border-background">
                  <Plus className="h-3.5 w-3.5 text-white" />
                </div>
              </motion.div>
              <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors text-center line-clamp-2 w-full">
                {createLabel}
              </span>
            </button>
          )}
        </motion.div>

        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            variants={staggerItem}
            onClick={() => onItemClick?.(item)}
            className="snap-start shrink-0 flex flex-col items-center gap-2 group w-[68px] sm:w-[72px] text-left"
          >
            <motion.div {...scaleTap}>
              <AitAvatarRing
                src={item.avatarSrc}
                fallback={item.fallback}
                size="lg"
                active={item.unviewed ?? false}
              />
            </motion.div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors text-center line-clamp-2 w-full">
              {item.label}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}

/** Create-story slot for use as {@link StoriesStrip} `createAction`. */
export function StoriesStripCreateLink({
  href,
  label,
  avatar,
}: {
  href: string;
  label: string;
  avatar: { src?: string | null; fallback: string };
}) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group w-[68px] sm:w-[72px]">
      <motion.div className="relative" {...scaleTap}>
        <AitAvatarRing src={avatar.src} fallback={avatar.fallback} size="lg" active={false} />
        <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full ait-btn-glow border-2 border-background">
          <Plus className="h-3.5 w-3.5 text-white" />
        </div>
      </motion.div>
      <span className="text-xs font-medium text-muted-foreground group-hover:text-white transition-colors text-center line-clamp-2 w-full">
        {label}
      </span>
    </Link>
  );
}
