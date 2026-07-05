import { useMemo } from "react";
import { BookMarked, Compass, Film, Globe, Sparkles } from "lucide-react";
import AitTabs from "@/components/ait-ui/AitTabs";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const TABS: Array<{
  id: SocialContentFormat;
  labelKey: string;
  icon: typeof Sparkles;
}> = [
  { id: "feed", labelKey: "social.formats.feed", icon: Sparkles },
  { id: "stories", labelKey: "social.formats.stories", icon: BookMarked },
  { id: "reels", labelKey: "social.formats.reels", icon: Film },
  { id: "journals", labelKey: "social.formats.journals", icon: Compass },
  { id: "public", labelKey: "social.formats.public", icon: Globe },
];

type SocialFormatTabsProps = {
  value: SocialContentFormat;
  onChange: (format: SocialContentFormat) => void;
  className?: string;
};

export default function SocialFormatTabs({ value, onChange, className }: SocialFormatTabsProps) {
  const { t } = useTranslation();

  const tabs = useMemo(
    () =>
      TABS.map(({ id, labelKey, icon }) => ({
        id,
        label: t(labelKey),
        icon,
      })),
    [t],
  );

  return (
    <AitTabs
      tabs={tabs}
      value={value}
      onChange={onChange}
      layoutId="social-format-tabs-glider"
      className={cn("mt-2 mb-6 w-full max-w-full", className)}
    />
  );
}
