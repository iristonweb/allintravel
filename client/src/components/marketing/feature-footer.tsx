import { Headphones, Map, Shield, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { icon: Sparkles, label: "Персональные рекомендации" },
  { icon: Map, label: "Офлайн-карты" },
  { icon: Headphones, label: "24/7 Support" },
  { icon: Shield, label: "Безопасные платежи" },
  { icon: Users, label: "Сообщество единомышленников" },
];

type FeatureFooterProps = {
  className?: string;
};

export default function FeatureFooter({ className }: FeatureFooterProps) {
  return (
    <section className={cn("border-t border-border/60 bg-background/40 backdrop-blur-xl", className)}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
          {features.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl ait-glass text-ait-purple">
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
