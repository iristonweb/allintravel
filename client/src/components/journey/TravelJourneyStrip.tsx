import { Link } from "wouter";
import { Compass, Map, MessageSquare, Share2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

export type JourneyStepId = "inspire" | "plan" | "explore" | "share" | "remember";

type StepDef = {
  id: JourneyStepId;
  href: string;
  icon: typeof Compass;
};

const STEPS: StepDef[] = [
  { id: "inspire", href: "/destinations", icon: Sparkles },
  { id: "plan", href: "/trips", icon: Compass },
  { id: "explore", href: "/map", icon: Map },
  { id: "share", href: "/social-feed", icon: Share2 },
  { id: "remember", href: "/passport", icon: MessageSquare },
];

type TravelJourneyStripProps = {
  activeStep?: JourneyStepId;
  className?: string;
  compact?: boolean;
};

export default function TravelJourneyStrip({
  activeStep = "plan",
  className,
  compact,
}: TravelJourneyStripProps) {
  const { t } = useTranslation();
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-3 md:p-4",
        className,
      )}
    >
      {!compact && (
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("journey.title", { defaultValue: "Your travel journey" })}
        </p>
      )}
      <div className="flex items-center gap-1 md:gap-2 overflow-x-auto scrollbar-none">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === activeStep;
          const isPast = index < activeIndex;
          return (
            <div key={step.id} className="flex items-center gap-1 md:gap-2 shrink-0">
              {index > 0 && (
                <div
                  className={cn(
                    "h-px w-4 md:w-8",
                    isPast || isActive ? "bg-ait-purple/60" : "bg-white/10",
                  )}
                />
              )}
              <Link
                href={step.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors",
                  isActive
                    ? "bg-ait-purple/20 text-white border border-ait-purple/40"
                    : "text-muted-foreground hover:text-white hover:bg-white/5",
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {!compact && (
                  <span>{t(`journey.steps.${step.id}`, { defaultValue: step.id })}</span>
                )}
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
