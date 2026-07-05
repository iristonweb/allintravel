import { useChatGroupSearchDialog } from "@/components/chat/ChatGroupSearchContext";
import AitSearchBar from "@/components/ait-ui/AitSearchBar";
import { Search } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type HeaderOmnibarProps = {
  className?: string;
  compact?: boolean;
};

export default function HeaderOmnibar({ className, compact }: HeaderOmnibarProps) {
  const { t } = useTranslation();
  const { open: openGroupSearch } = useChatGroupSearchDialog();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openGroupSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openGroupSearch]);

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => openGroupSearch()}
        className={cn(
          "md:hidden flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10",
          className,
        )}
        aria-label={t("search.placeholder")}
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => openGroupSearch()}
      className={cn("hidden md:flex flex-1 max-w-2xl min-w-0", className)}
      aria-label={t("search.placeholder", { defaultValue: "Search places, routes…" })}
    >
      <div className="ait-omnibar w-full flex items-center px-4 py-2.5 gap-3 cursor-pointer">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground flex-1 text-left truncate">
          {t("search.placeholder")}
        </span>
        <kbd className="hidden sm:inline-flex h-6 select-none items-center rounded-md border border-white/10 bg-white/5 px-2 font-mono text-[10px] font-medium text-muted-foreground shrink-0">
          ⌘K
        </kbd>
      </div>
    </button>
  );
}
