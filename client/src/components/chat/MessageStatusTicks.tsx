import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageDeliveryStatus } from "@shared/schema";
import { useTranslation } from "react-i18next";

type MessageStatusTicksProps = {
  status?: MessageDeliveryStatus;
  className?: string;
};

export default function MessageStatusTicks({
  status = "sent",
  className,
}: MessageStatusTicksProps) {
  const { t } = useTranslation();
  const isRead = status === "read";
  const isDelivered = status === "delivered" || isRead;
  const Icon = isDelivered ? CheckCheck : Check;

  return (
    <Icon
      className={cn(
        "h-3 w-3 shrink-0",
        isRead ? "text-blue-500" : "text-muted-foreground/70",
        className,
      )}
      aria-label={
        isRead
          ? t("messages.statusRead")
          : isDelivered
            ? t("messages.statusDelivered")
            : t("messages.statusSent")
      }
    />
  );
}
