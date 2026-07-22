import { Link, useLocation } from "wouter";
import { Home, MapPin, MoreHorizontal, Plus, User, Wallet, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavLabels } from "@/hooks/useNavLabels";
import { isNavActive, navItemByHref } from "@/lib/nav-groups";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const extraIcons: Record<string, LucideIcon> = {
  "/wallet": Wallet,
  "/profile/music": Music,
  "/profile": User,
};

const walletBadge = "AIT";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { mobileMainNav, mobileEcosystemNav } = useNavLabels();

  const ecosystemActive = mobileEcosystemNav.some((item) => isNavActive(location, item.href));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-4 pt-2"
      aria-label={t("nav.ariaLabel", { defaultValue: "Main navigation" })}
    >
      <div className="ait-glass-strong rounded-panel px-2 py-2.5 flex items-center justify-between border border-white/10 shadow-ait-elevation-2 max-w-lg mx-auto backdrop-blur-xl">
        {mobileMainNav.map((item) => {
          const navMeta = navItemByHref(item.href);
          const Icon =
            item.href === "/trips" ? Plus : (navMeta?.icon ?? extraIcons[item.href] ?? Home);
          const isFab = item.href === "/trips" && !item.label;
          const active = !isFab && isNavActive(location, item.href);

          if (isFab) {
            return (
              <Link key={item.href} href={item.href} className="flex-1 flex justify-center">
                <motion.span
                  className="flex -mt-7 h-14 w-14 items-center justify-center rounded-[20px] ait-btn-glow text-white"
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.5} />
                </motion.span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="flex-1 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 rounded-2xl"
            >
              <span
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-colors duration-200",
                  active
                    ? "text-primary bg-primary/10 before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:h-0.5 before:w-8 before:rounded-full before:bg-primary before:content-['']"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.5} />
                <span className="text-[9px] font-medium truncate max-w-full px-0.5">
                  {item.label}
                </span>
              </span>
            </Link>
          );
        })}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-2xl min-w-0 transition-colors duration-200",
                ecosystemActive
                  ? "text-primary bg-primary/10 before:absolute before:top-0 before:left-1/2 before:-translate-x-1/2 before:h-0.5 before:w-8 before:rounded-full before:bg-primary before:content-['']"
                  : "text-muted-foreground",
              )}
            >
              <MoreHorizontal className="h-5 w-5" strokeWidth={1.5} />
              <span className="text-[9px] font-medium">{t("nav.more", { defaultValue: "More" })}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="ait-glass-strong border-white/10 mb-2 min-w-[200px]"
          >
            {mobileEcosystemNav.map((item) => {
              const navMeta = navItemByHref(item.href);
              const Icon = navMeta?.icon ?? extraIcons[item.href] ?? MapPin;
              const badge = item.href === "/wallet" ? walletBadge : undefined;
              return (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="cursor-pointer gap-2 flex items-center">
                    <Icon className="h-4 w-4 text-ait-purple" strokeWidth={1.5} />
                    <span className="flex-1">{item.label}</span>
                    {badge && (
                      <span className="text-[10px] font-bold text-ait-orange">{badge}</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
