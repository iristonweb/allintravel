import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { playNotificationSound } from "@/lib/notification-sound";
import i18n from "@/i18n";

export type AppNotificationToastOptions = {
  title: string;
  body?: string;
  url?: string;
  soundKind?: "default" | "ait";
  playSound?: boolean;
};

export function showAppNotificationToast(opts: AppNotificationToastOptions) {
  if (opts.playSound !== false) {
    playNotificationSound(opts.soundKind ?? "default");
  }

  const openLabel = i18n.t("engagement.toastOpen");
  const action = opts.url ? (
    <ToastAction
      altText={openLabel}
      onClick={() => {
        window.location.href = opts.url!;
      }}
    >
      {openLabel}
    </ToastAction>
  ) : undefined;

  toast({
    title: opts.title,
    description: opts.body,
    action,
  });
}

export function truncateNotificationPreview(text: string, max = 80): string {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}
