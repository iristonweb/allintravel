import { Link, useLocation } from "wouter";
import {
  Calendar,
  Home,
  Map,
  MapPin,
  MessageCircle,
  User,
  Users,
  Wallet,
  BookOpen,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  sidebarPrimaryNav,
  sidebarDiscoverNav,
  sidebarExtraNav,
} from "@/lib/nav-config";
import type { LucideIcon } from "lucide-react";

const iconByHref: Record<string, LucideIcon> = {
  "/": Home,
  "/map": Map,
  "/trips": Calendar,
  "/social-feed": Users,
  "/friends": Users,
  "/messages": MessageCircle,
  "/profile": User,
  "/places": MapPin,
  "/events": Sparkles,
  "/blog": BookOpen,
  "/wallet": Wallet,
  "/chat": MessageSquare,
};

type NavItemWithMeta = { href: string; label: string; badge?: string };

function NavIcon({
  item,
  active,
}: {
  item: NavItemWithMeta;
  active: boolean;
}) {
  const Icon = iconByHref[item.href] ?? MapPin;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={item.href}>
          <span
            className={cn(
              "relative flex h-11 w-11 items-center justify-center rounded-xl transition-all",
              active
                ? "ait-nav-active text-white"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.badge && (
              <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold px-1 rounded bg-ait-orange text-white leading-tight">
                {item.badge}
              </span>
            )}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function NavSection({ items, activeFn }: { items: NavItemWithMeta[]; activeFn: (href: string) => boolean }) {
  return (
    <>
      {items.map((item) => (
        <NavIcon key={item.href} item={item} active={activeFn(item.href)} />
      ))}
    </>
  );
}

export default function AppIconSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/"
      ? location === "/"
      : location === href || location.startsWith(`${href}/`);

  const extraItems: NavItemWithMeta[] = sidebarExtraNav.map((item) =>
    item.href === "/wallet" ? { ...item, badge: "Demo" } : item,
  );

  return (
    <aside
      className="hidden md:flex fixed left-0 top-20 z-40 h-[calc(100vh-var(--ait-header-h,5rem))] w-[72px] flex-col items-center gap-0.5 border-r border-border/60 bg-background/40 backdrop-blur-xl py-3 overflow-y-auto overscroll-contain"
      aria-label="Основная навигация"
    >
      <NavSection items={sidebarPrimaryNav} activeFn={isActive} />
      <div className="w-8 border-t border-white/10 my-2 shrink-0" aria-hidden />
      <NavSection items={sidebarDiscoverNav} activeFn={isActive} />
      <div className="w-8 border-t border-white/10 my-2 shrink-0" aria-hidden />
      <NavSection items={extraItems} activeFn={isActive} />
    </aside>
  );
}
