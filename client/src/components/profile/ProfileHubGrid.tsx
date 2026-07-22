import { Link } from "wouter";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Badge } from "@/components/ui/badge";
import type { ProfileHubLink } from "@/lib/profile-hub-links";
import { ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type ProfileHubGridProps = {
  links: ProfileHubLink[];
  walletBalance?: number;
};

export default function ProfileHubGrid({ links, walletBalance }: ProfileHubGridProps) {
  const { t } = useTranslation();

  return (
    <AitSurface padding="sm" className="mb-6">
      <h2 className="text-sm font-medium mb-3">{t("profile.hubSection")}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {links.map((item) => (
          <Link key={item.href} href={item.href}>
            <div className="flex items-center gap-3 p-3 rounded-card-lg border border-border/50 hover:bg-card/60 hover:shadow-md transition-all duration-300">
              <item.icon className="h-5 w-5 text-primary shrink-0" strokeWidth={1.5} aria-hidden />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
              </div>
              {item.href === "/wallet" && walletBalance != null ? (
                <Badge className="shrink-0 bg-ait-orange/90 border-0 text-[10px] tabular-nums">
                  {walletBalance > 999 ? `${Math.floor(walletBalance / 1000)}k` : walletBalance}
                </Badge>
              ) : item.badge ? (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {item.badge}
                </Badge>
              ) : null}
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </div>
          </Link>
        ))}
      </div>
    </AitSurface>
  );
}
