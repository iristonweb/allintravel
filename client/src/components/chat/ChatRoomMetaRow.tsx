import { Lock, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ChatRoomMetaRowProps = {
  isLegacy?: boolean | null;
  visibility?: string | null;
  className?: string;
  size?: "sm" | "md";
};

export default function ChatRoomMetaRow({
  isLegacy,
  visibility,
  className,
  size = "sm",
}: ChatRoomMetaRowProps) {
  const { t } = useTranslation();

  if (!isLegacy && visibility !== "private") return null;

  const chipClass =
    size === "sm"
      ? "text-[10px] leading-tight px-2 py-0.5 gap-1"
      : "text-xs leading-tight px-2.5 py-0.5 gap-1.5";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5 mt-1.5", className)}>
      {isLegacy ? (
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-ait-purple/35 bg-ait-purple/10 font-medium text-ait-purple",
            chipClass,
          )}
        >
          <ShieldCheck className="h-3 w-3 shrink-0" aria-hidden />
          {t("chat.legacy.badge")}
        </span>
      ) : null}
      {visibility === "private" ? (
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-white/15 bg-white/5 font-medium text-muted-foreground",
            chipClass,
          )}
        >
          <Lock className="h-3 w-3 shrink-0" aria-hidden />
          {t("chat.roomSettings.visibilityPrivate")}
        </span>
      ) : null}
    </div>
  );
}
