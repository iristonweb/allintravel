import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  Share2,
  Volume2,
  VolumeX,
  Pause,
  Play,
} from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import AitBadge from "@/components/ait-ui/AitBadge";
import AitAvatarRing from "@/components/ait-ui/AitAvatarRing";
import AitInput from "@/components/ait-ui/AitInput";
import AitSurface from "@/components/ait-ui/AitSurface";
import PostComments from "@/components/social/PostComments";
import { useReelPlayer } from "@/hooks/useReelPlayer";
import { heartBurstVariants, scaleTap, slideUpPanel } from "@/lib/ait-motion";
import { cn } from "@/lib/utils";
import { isDemoPostId } from "@/lib/demo-reels-feed";

export type ReelCardViewModel = {
  id: string;
  videoSrc?: string | null;
  posterSrc?: string | null;
  isVideo?: boolean;
  authorName: string;
  authorAvatar?: string | null;
  authorFallback: string;
  authorAction?: ReactNode;
  authorHref?: string;
  isPro?: boolean;
  location?: string;
  title?: string;
  description?: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
};

type ReelCardLabels = {
  doubleTapLike?: string;
  videoUnavailable?: string;
  like?: string;
  comments?: string;
  share?: string;
  save?: string;
  mute?: string;
  unmute?: string;
  pause?: string;
  play?: string;
  commentPlaceholder?: string;
  publish?: string;
};

type ReelCardProps = {
  reel: ReelCardViewModel;
  isActive?: boolean;
  muted?: boolean;
  bookmarked?: boolean;
  commentsOpen?: boolean;
  commentText?: string;
  likePending?: boolean;
  commentPending?: boolean;
  actionsDisabled?: boolean;
  labels?: ReelCardLabels;
  onLike?: () => void;
  onCommentToggle?: () => void;
  onCommentChange?: (value: string) => void;
  onSubmitComment?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onToggleMute?: () => void;
  onDoubleTapLike?: () => void;
  className?: string;
};

const DEFAULT_LABELS: Required<ReelCardLabels> = {
  doubleTapLike: "Double tap to like",
  videoUnavailable: "Video unavailable",
  like: "Like",
  comments: "Comments",
  share: "Share",
  save: "Save",
  mute: "Mute",
  unmute: "Unmute",
  pause: "Pause",
  play: "Play",
  commentPlaceholder: "Write a comment…",
  publish: "Publish",
};

function ReelActionButton({
  label,
  onClick,
  disabled,
  activeClassName,
  className,
  children,
  hideOnMobile,
}: {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  activeClassName?: string;
  className?: string;
  children: ReactNode;
  hideOnMobile?: boolean;
}) {
  return (
    <motion.div
      className={cn("flex flex-col items-center", hideOnMobile && "hidden sm:flex")}
      {...scaleTap}
    >
      <AitButton
        variant="ghost"
        size="icon"
        className={cn(
          "h-10 w-10 sm:h-11 sm:w-11 rounded-full text-white hover:bg-white/10",
          activeClassName,
          className,
        )}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
      >
        {children}
      </AitButton>
    </motion.div>
  );
}

export default function ReelCard({
  reel,
  isActive = false,
  muted = true,
  bookmarked = false,
  commentsOpen = false,
  commentText = "",
  likePending,
  commentPending,
  actionsDisabled = false,
  labels: labelsProp,
  onLike,
  onCommentToggle,
  onCommentChange,
  onSubmitComment,
  onShare,
  onBookmark,
  onToggleMute,
  onDoubleTapLike,
  className,
}: ReelCardProps) {
  const { t } = useTranslation();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const disabled = actionsDisabled || isDemoPostId(reel.id);
  const lastTapRef = useRef(0);
  const singleTapTimerRef = useRef<number | null>(null);
  const [heartBurst, setHeartBurst] = useState(false);
  const [likePulse, setLikePulse] = useState(false);

  const isVideo = reel.isVideo ?? Boolean(reel.videoSrc);
  const mediaSrc = reel.videoSrc ?? reel.posterSrc;

  const { videoRef, progress, isPlaying, togglePlay, handleTimeUpdate } = useReelPlayer({
    isActive,
    muted,
    isVideo,
  });

  const triggerDoubleTap = useCallback(() => {
    onDoubleTapLike?.();
    setHeartBurst(true);
    setLikePulse(true);
    window.setTimeout(() => {
      setHeartBurst(false);
      setLikePulse(false);
    }, 800);
  }, [onDoubleTapLike]);

  const handleLikeClick = useCallback(() => {
    onLike?.();
    setLikePulse(true);
    window.setTimeout(() => setLikePulse(false), 400);
  }, [onLike]);

  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
        singleTapTimerRef.current = null;
      }
      triggerDoubleTap();
      lastTapRef.current = 0;
      return;
    }

    lastTapRef.current = now;
    singleTapTimerRef.current = window.setTimeout(() => {
      if (lastTapRef.current === now) {
        togglePlay();
        lastTapRef.current = 0;
      }
      singleTapTimerRef.current = null;
    }, 300);
  }, [triggerDoubleTap, togglePlay]);

  useEffect(() => {
    return () => {
      if (singleTapTimerRef.current) {
        window.clearTimeout(singleTapTimerRef.current);
      }
    };
  }, []);

  return (
    <AitSurface
      padding="none"
      radius="xl"
      className={cn("relative h-full w-full bg-black overflow-hidden", className)}
    >
      <motion.button
        type="button"
        className="absolute inset-0 z-0"
        onClick={handleTap}
        aria-label={labels.doubleTapLike}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.15 }}
      >
        {mediaSrc && isVideo ? (
          <video
            ref={videoRef}
            src={reel.videoSrc ?? undefined}
            poster={reel.posterSrc ?? undefined}
            className="h-full w-full object-cover"
            muted={muted}
            loop
            playsInline
            onTimeUpdate={handleTimeUpdate}
          />
        ) : mediaSrc ? (
          <img src={mediaSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-white/50 text-sm">
            {labels.videoUnavailable}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {!isPlaying && isActive && isVideo && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Pause className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {heartBurst && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
            variants={heartBurstVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <Heart className="h-20 w-20 sm:h-24 sm:w-24 text-red-500 fill-red-500 drop-shadow-[0_0_24px_rgba(239,68,68,0.55)]" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-0.5 sm:h-1 bg-white/10 overflow-hidden">
        <motion.div
          className="h-full w-full origin-left bg-gradient-to-r from-ait-purple to-ait-orange"
          animate={{ scaleX: Math.max(progress, 0.001) }}
          initial={false}
          transition={{ duration: 0.1 }}
        />
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 sm:p-4 pr-14 sm:pr-20 pb-4 sm:pb-5 pointer-events-none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: isActive ? 1 : 0.85, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="pointer-events-auto flex items-center gap-2 mb-2">
          {reel.authorAction ?? (
            <AitAvatarRing
              src={reel.authorAvatar}
              fallback={reel.authorFallback}
              size="sm"
              active={false}
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {reel.authorHref ? (
                <Link href={reel.authorHref}>
                  <span className="text-sm font-semibold text-white truncate hover:underline">
                    {reel.authorName}
                  </span>
                </Link>
              ) : (
                <span className="text-sm font-semibold text-white truncate">{reel.authorName}</span>
              )}
              {reel.isPro && <AitBadge tone="pro">PRO</AitBadge>}
              {disabled && (
                <AitBadge tone="default" className="text-[10px] px-1.5 py-0">
                  {t("social.demoBadge")}
                </AitBadge>
              )}
            </div>
            {reel.location && (
              <p className="flex items-center gap-1 text-xs text-white/70 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{reel.location}</span>
              </p>
            )}
          </div>
        </div>
        {reel.title && (
          <p className="text-white font-semibold text-sm line-clamp-2">{reel.title}</p>
        )}
        {reel.description?.trim() && reel.description.trim() !== " " && (
          <p className="text-white/80 text-xs mt-1 line-clamp-2 leading-relaxed">
            {reel.description}
          </p>
        )}
      </motion.div>

      <div className="absolute right-1.5 sm:right-3 bottom-20 sm:bottom-24 z-10 flex flex-col items-center gap-1.5 sm:gap-3">
        <motion.div
          animate={likePulse ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          <ReelActionButton
            label={labels.like}
            onClick={handleLikeClick}
            disabled={likePending || disabled}
            activeClassName={reel.isLiked ? "text-red-400" : undefined}
          >
            <Heart className={cn("h-5 w-5 sm:h-6 sm:w-6", reel.isLiked && "fill-current")} />
          </ReelActionButton>
        </motion.div>
        {(reel.likesCount ?? 0) > 0 && (
          <span className="text-[10px] sm:text-xs text-white font-medium -mt-1.5 sm:-mt-2">
            {reel.likesCount}
          </span>
        )}

        <ReelActionButton
          label={labels.comments}
          onClick={onCommentToggle}
          disabled={disabled}
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
        </ReelActionButton>
        {(reel.commentsCount ?? 0) > 0 && (
          <span className="text-[10px] sm:text-xs text-white font-medium -mt-1.5 sm:-mt-2">
            {reel.commentsCount}
          </span>
        )}

        <ReelActionButton label={muted ? labels.unmute : labels.mute} onClick={onToggleMute}>
          {muted ? (
            <VolumeX className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </ReelActionButton>

        <ReelActionButton
          label={isPlaying ? labels.pause : labels.play}
          onClick={togglePlay}
          hideOnMobile
        >
          {isPlaying ? (
            <Pause className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Play className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </ReelActionButton>

        <ReelActionButton label={labels.share} onClick={onShare}>
          <Share2 className="h-5 w-5 sm:h-6 sm:w-6" />
        </ReelActionButton>

        <ReelActionButton
          label={labels.save}
          onClick={onBookmark}
          disabled={disabled}
          activeClassName={bookmarked ? "text-ait-orange" : undefined}
        >
          <Bookmark className={cn("h-5 w-5 sm:h-6 sm:w-6", bookmarked && "fill-current")} />
        </ReelActionButton>
      </div>

      <AnimatePresence>
        {commentsOpen && (
          <motion.div
            className="absolute inset-x-0 bottom-0 z-30 bg-black/80 backdrop-blur-sm p-3 sm:p-4 border-t border-white/10 max-h-[50vh] overflow-y-auto"
            variants={slideUpPanel}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <PostComments postId={reel.id} enabled={commentsOpen} />
            {!disabled && (
              <form
                className="flex gap-2 mt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmitComment?.();
                }}
              >
                <AitInput
                  value={commentText}
                  onChange={(e) => onCommentChange?.(e.target.value)}
                  placeholder={labels.commentPlaceholder}
                  className="flex-1 h-10 text-sm"
                />
                <AitButton type="submit" variant="primary" size="sm" disabled={commentPending}>
                  {labels.publish}
                </AitButton>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </AitSurface>
  );
}
