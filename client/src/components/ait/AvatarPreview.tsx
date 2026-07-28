"use client";

import { useState, type ReactNode, type MouseEvent } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/resolve-media-url";

type AvatarPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already-resolved or raw media URL */
  src: string;
  label?: string | null;
  alt?: string;
};

/** Full-size avatar viewer — Telegram / Instagram style. */
export function AvatarPreviewDialog({
  open,
  onOpenChange,
  src,
  label,
  alt,
}: AvatarPreviewDialogProps) {
  const { t } = useTranslation();
  const resolved = resolveAvatarSrc(src) ?? src;
  const title = label?.trim() || alt || t("avatarPreview.title");

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-0 z-[121] flex flex-col items-center justify-center p-6 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-200"
          onClick={() => onOpenChange(false)}
        >
          <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Close
            className="absolute right-4 top-4 sm:right-6 sm:top-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/90 backdrop-blur-md transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
            aria-label={t("avatarPreview.close")}
            onClick={(e) => e.stopPropagation()}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </DialogPrimitive.Close>

          <div
            className="relative flex flex-col items-center gap-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rounded-full p-[3px] bg-gradient-to-tr from-ait-purple via-ait-violet to-ait-orange shadow-[0_0_60px_rgba(139,92,246,0.45)]">
              <div className="overflow-hidden rounded-full border-[3px] border-[#050816] bg-[#050816]">
                <img
                  src={resolved}
                  alt={alt || title}
                  className="block h-[min(72vw,340px)] w-[min(72vw,340px)] object-cover object-[center_20%] select-none"
                  draggable={false}
                />
              </div>
            </div>
            {label?.trim() ? (
              <p className="max-w-[min(72vw,340px)] truncate text-center text-base font-medium text-white/90">
                {label.trim()}
              </p>
            ) : null}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

type AvatarPreviewTriggerProps = {
  src?: string | null;
  label?: string | null;
  alt?: string;
  /** When false, children render without preview (e.g. no photo yet). Default true. */
  enabled?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * Wraps an avatar so click opens the full-size preview modal.
 * Does nothing (no button) when there is no resolvable image URL.
 */
export function AvatarPreviewTrigger({
  src,
  label,
  alt,
  enabled = true,
  className,
  children,
}: AvatarPreviewTriggerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const previewSrc = resolveAvatarSrc(src);

  if (!enabled || !previewSrc) {
    return <div className={cn("relative", className)}>{children}</div>;
  }

  const openPreview = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      <button
        type="button"
        className={cn(
          "relative block cursor-zoom-in rounded-full appearance-none border-0 bg-transparent p-0 text-left",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ait-purple/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className,
        )}
        aria-label={t("avatarPreview.open")}
        onClick={openPreview}
      >
        {children}
      </button>
      <AvatarPreviewDialog
        open={open}
        onOpenChange={setOpen}
        src={previewSrc}
        label={label}
        alt={alt}
      />
    </>
  );
}
