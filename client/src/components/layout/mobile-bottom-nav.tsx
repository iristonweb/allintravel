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

const extraIcons: Record<string, LucideIcon> = {
  "/wallet": Wallet,
  "/profile/music": Music,
  "/profile": User,
};

const walletBadge = "AIT";

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { mobileMainNav, mobileEcosystemNav } = useNavLabels();

  const ecosystemActive = mobileEcosystemNav.some((item) => isNavActive(location, item.href));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-4 pt-2">
      <div className="ait-glass-strong rounded-panel px-1.5 py-2 flex items-center justify-between border border-white/10 shadow-2xl max-w-lg mx-auto">
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
            <Link key={item.href} href={item.href} className="flex-1 min-w-0">
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 py-1.5 rounded-2xl transition-colors",
                  active ? "text-white" : "text-slate-500",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-[#8b5cf6]")} />
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
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 rounded-2xl min-w-0",
                ecosystemActive ? "text-white" : "text-slate-500",
              )}
            >
              <MoreHorizontal className={cn("h-5 w-5", ecosystemActive && "text-[#8b5cf6]")} />
              <span className="text-[9px] font-medium">Ещё</span>
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
                    <Icon className="h-4 w-4 text-ait-purple" />
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
