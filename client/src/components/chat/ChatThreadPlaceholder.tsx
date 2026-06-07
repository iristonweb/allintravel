import { MessageCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

type ChatTab = "personal" | "unread";

type ChatThreadPlaceholderProps = {
  chatTab: ChatTab;
};

export default function ChatThreadPlaceholder({ chatTab }: ChatThreadPlaceholderProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-1 items-center justify-center p-8 ait-chat-thread">
      <div className="text-center ait-glass-ios rounded-3xl px-10 py-8 max-w-sm">
        <MessageCircle className="mx-auto h-12 w-12 text-ait-purple mb-4 opacity-80" />
        <h3 className="text-lg font-semibold mb-2">
          {chatTab === "unread"
            ? t("chat.page.placeholder.unreadTitle")
            : t("chat.page.placeholder.personalTitle")}
        </h3>
        <p className="text-muted-foreground text-sm">{t("chat.page.placeholder.selectDialog")}</p>
      </div>
    </div>
  );
}
