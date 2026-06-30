import { BookMarked, Compass, Film, Globe, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SocialContentFormat } from "@/hooks/useSocialFeedParams";
import { useTranslation } from "react-i18next";

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
};

export default function SocialFormatTabs({ value, onChange }: SocialFormatTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-1.5 mt-6 mb-4 ait-glass rounded-full p-1 w-fit">
      {TABS.map(({ id, labelKey, icon: Icon }) => (
        <Button
          key={id}
          size="sm"
          variant="filter"
          className={cn(
            value === id && "ait-btn-glow border-0 text-white shadow-none hover:text-white",
          )}
          onClick={() => onChange(id)}
        >
          <Icon className="h-4 w-4 mr-1" />
          {t(labelKey)}
        </Button>
      ))}
    </div>
  );
}
