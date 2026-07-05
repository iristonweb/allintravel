import { Link } from "wouter";
import AitButton from "@/components/ait-ui/AitButton";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function HeaderAiScout() {
  const { t } = useTranslation();

  return (
    <AitButton variant="glass" size="sm" className="hidden lg:inline-flex gap-2 h-10" asChild>
      <Link href="/trips?ai=1">
        <Sparkles className="h-4 w-4 text-ait-purple" />
        {t("nav.aiScout", { defaultValue: "AI Scout" })}
      </Link>
    </AitButton>
  );
}
