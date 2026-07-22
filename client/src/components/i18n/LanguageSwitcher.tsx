import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
] as const;

type LanguageSwitcherProps = {
  className?: string;
  variant?: "ghost" | "outline";
};

export default function LanguageSwitcher({ className, variant = "ghost" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const current = i18n.language?.startsWith("en") ? "en" : "ru";

  async function selectLanguage(code: "en" | "ru") {
    await i18n.changeLanguage(code);
    if (!isAuthenticated) return;
    try {
      await apiRequest("PUT", "/api/users/me", { preferredLocale: code });
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    } catch {
      // Locale still applied locally; server persist can retry on next switch.
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size="icon"
          className={cn("h-10 w-10 rounded-xl", className)}
          title={t("common.language")}
          aria-label={t("common.language")}
        >
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px]">
        {LANGUAGES.map(({ code, label }) => (
          <DropdownMenuItem
            key={code}
            onClick={() => void selectLanguage(code)}
            className={cn(current === code && "font-semibold text-[#a78bfa]")}
          >
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
