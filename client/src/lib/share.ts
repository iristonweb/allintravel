import i18n from "i18next";
import { toast } from "@/hooks/use-toast";

export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

type ShareUrlOptions = {
  /** When false, caller handles all user feedback (default: true). */
  toast?: boolean;
};

export async function shareUrl(
  url: string,
  title?: string,
  text?: string,
  options?: ShareUrlOptions,
): Promise<ShareOutcome> {
  const notify = options?.toast !== false;
  const shareData = { url, title: title ?? document.title, text };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(shareData);
      return "shared";
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    if (notify) {
      toast({
        title: i18n.t("common.shareLinkCopied", { defaultValue: "Link copied" }),
        description: i18n.t("common.shareLinkCopiedHint", {
          defaultValue: "Send it to friends",
        }),
      });
    }
    return "copied";
  } catch {
    if (notify) {
      toast({
        title: i18n.t("common.shareFailed", { defaultValue: "Could not share" }),
        variant: "destructive",
      });
    }
    return "failed";
  }
}

/** Build public profile URL for passport sharing. */
export function passportPublicUrl(username: string): string {
  return `${window.location.origin}/u/${encodeURIComponent(username)}`;
}
