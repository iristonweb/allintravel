import { useState, type MouseEvent } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarPreviewDialog } from "@/components/ait/AvatarPreview";
import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/resolve-media-url";
import { useTranslation } from "react-i18next";

type CreatorAvatarProps = {
  src?: string | null;
  fallback: string;
  creatorBadge?: boolean;
  className?: string;
  label?: string | null;
  /** Open full-size preview on click when a photo exists. Default true. */
  previewable?: boolean;
};

export default function CreatorAvatar({
  src,
  fallback,
  creatorBadge,
  className,
  label,
  previewable = true,
}: CreatorAvatarProps) {
  const { t } = useTranslation();
  const [previewOpen, setPreviewOpen] = useState(false);
  const imageSrc = resolveAvatarSrc(src);
  const canPreview = previewable && Boolean(imageSrc);

  const inner = (
    <>
      <Avatar
        className={cn(
          "h-full w-full",
          creatorBadge &&
            "ring-2 ring-ait-orange/90 ring-offset-2 ring-offset-background shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        )}
      >
        <AvatarImage src={imageSrc} alt="" />
        <AvatarFallback className="bg-gradient-to-br from-ait-purple/80 to-ait-orange/70 text-white">
          {fallback}
        </AvatarFallback>
      </Avatar>
      {creatorBadge ? (
        <span
          className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-gradient-to-br from-ait-orange to-ait-gold border-2 border-background shadow-sm pointer-events-none"
          title="Storyteller"
        />
      ) : null}
    </>
  );

  if (!canPreview || !imageSrc) {
    return <div className={cn("relative shrink-0 h-10 w-10", className)}>{inner}</div>;
  }

  const openPreview = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPreviewOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative block h-10 w-10 shrink-0 cursor-zoom-in appearance-none border-0 bg-transparent p-0 rounded-full",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
        aria-label={t("avatarPreview.open")}
        onClick={openPreview}
      >
        {inner}
      </button>
      <AvatarPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        src={imageSrc}
        label={label}
      />
    </>
  );
}
