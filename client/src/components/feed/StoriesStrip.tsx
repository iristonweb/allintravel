import { Link } from "wouter";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem, scaleTap } from "@/lib/ait-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ReactNode } from "react";

export type StoryStripItem = {
  id: string;
  label: string;
  avatarSrc?: string | null;
  previewSrc?: string | null;
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

function StoryPreviewCard({
  previewSrc,
  avatarSrc,
  fallback,
  label,
  unviewed,
  onClick,
}: {
  previewSrc?: string | null;
  avatarSrc?: string | null;
  fallback: string;
  label: string;
  unviewed?: boolean;
  onClick?: () => void;
}) {
  const src = previewSrc ?? avatarSrc;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="snap-start shrink-0 text-left group"
      {...scaleTap}
    >
      <div
        className={cn(
          "relative w-[82px] h-[132px] rounded-[24px] p-[2.5px] transition-all duration-200",
          unviewed
            ? "bg-gradient-to-tr from-ait-purple via-ait-violet to-ait-orange shadow-[0_0_20px_rgba(139,92,246,0.35)]"
            : "bg-white/12",
        )}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[21px] bg-ait-deep">
          {src ? (
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center bg-ait-navy text-white/40 text-lg font-semibold">
              {fallback}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 min-w-0">
            <Avatar className="h-5 w-5 border border-white/30 shrink-0">
              <AvatarImage src={avatarSrc ?? src ?? undefined} />
              <AvatarFallback className="text-[8px]">{fallback}</AvatarFallback>
            </Avatar>
            <span className="text-[10px] font-medium text-white truncate leading-tight">
              {label}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function CreateStoryCard({
  label,
  avatar,
  onClick,
  href,
}: {
  label: string;
  avatar: { src?: string | null; fallback: string };
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <div className="snap-start shrink-0 flex flex-col items-center gap-2 group w-[82px]">
      <motion.div className="relative w-[82px] h-[132px]" {...scaleTap}>
        <div className="relative h-full w-full rounded-[24px] p-[2.5px] bg-white/12">
          <div className="relative h-full w-full overflow-hidden rounded-[21px] bg-ait-deep/90 flex flex-col items-center justify-center gap-2">
            <Avatar className="h-10 w-10 border-2 border-white/20">
              <AvatarImage src={avatar.src ?? undefined} />
              <AvatarFallback>{avatar.fallback}</AvatarFallback>
            </Avatar>
            <div className="flex h-7 w-7 items-center justify-center rounded-full ait-btn-glow border-2 border-background">
              <Plus className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        </div>
      </motion.div>
      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-white transition-colors text-center line-clamp-2 w-full">
        {label}
      </span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className="block text-left">
      {inner}
    </button>
  );
}

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
        className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide touch-pan-x"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={staggerItem}>
          {createAction ?? (
            <CreateStoryCard label={createLabel} avatar={yourStoryAvatar} onClick={onCreateClick} />
          )}
        </motion.div>

        {items.map((item) => (
          <motion.div key={item.id} variants={staggerItem}>
            <StoryPreviewCard
              previewSrc={item.previewSrc ?? item.avatarSrc}
              avatarSrc={item.avatarSrc}
              fallback={item.fallback}
              label={item.label}
              unviewed={item.unviewed}
              onClick={() => onItemClick?.(item)}
            />
          </motion.div>
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
  return <CreateStoryCard href={href} label={label} avatar={avatar} />;
}
