import type { TFunction } from "i18next";
import { passportPublicUrl, shareUrl, type ShareOutcome } from "@/lib/share";

type ToastFn = (opts: {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}) => void;

/** Share passport profile with consistent toast feedback (no duplicates). */
export async function sharePassportProfile(
  username: string,
  t: TFunction,
  showToast: ToastFn,
): Promise<ShareOutcome> {
  const url = passportPublicUrl(username);
  const outcome = await shareUrl(url, t("passport.title"), undefined, { toast: false });

  switch (outcome) {
    case "shared":
      showToast({
        title: t("passport.sharedSuccess", { defaultValue: "Passport shared" }),
        description: url,
      });
      break;
    case "copied":
      showToast({
        title: t("common.copied", { defaultValue: "Copied" }),
        description: url,
      });
      break;
    case "failed":
      showToast({
        title: t("common.shareFailed", { defaultValue: "Could not share" }),
        description: url,
        variant: "destructive",
      });
      break;
    case "cancelled":
      break;
  }

  return outcome;
}
