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
  sidebarPrimaryNav,
  sidebarDiscoverNav,
  sidebarExtraNav,
} from "@/lib/nav-config";
import type { LucideIcon } from "lucide-react";

/** Collapsed rail width — keep in sync with app-shell md:pl-[72px] */
export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_WIDTH_EXPANDED = 220;

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

function NavItem({
  item,
  active,
}: {
  item: NavItemWithMeta;
  active: boolean;
}) {
  const Icon = iconByHref[item.href] ?? MapPin;
  return (
    <Link href={item.href}>
      <span
        className={cn(
          "relative flex h-11 w-full items-center gap-3 rounded-xl px-3 transition-colors",
          active
            ? "ait-nav-active text-white"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
        )}
      >
        <Icon className="h-5 w-5 shrink-0" aria-hidden />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium",
            "opacity-0 max-w-0 overflow-hidden transition-all duration-200 ease-out",
            "group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[160px]",
            "group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-w-[160px]",
          )}
        >
          {item.label}
        </span>
        {item.badge && (
          <span
            className={cn(
              "shrink-0 text-[10px] font-bold text-ait-orange",
              "opacity-0 max-w-0 overflow-hidden transition-all duration-200",
              "group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[3rem]",
              "group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-w-[3rem]",
            )}
          >
            {item.badge}
          </span>
        )}
      </span>
    </Link>
  );
}

function NavSection({
  items,
  activeFn,
}: {
  items: NavItemWithMeta[];
  activeFn: (href: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      {items.map((item) => (
        <NavItem key={item.href} item={item} active={activeFn(item.href)} />
      ))}
    </div>
  );
}

function SectionDivider() {
  return (
    <div
      className={cn(
        "my-2 shrink-0 border-t border-white/10 transition-all duration-200",
        "w-10 mx-auto group-hover/sidebar:w-[calc(100%-1rem)] group-hover/sidebar:mx-2",
        "group-focus-within/sidebar:w-[calc(100%-1rem)] group-focus-within/sidebar:mx-2",
      )}
      aria-hidden
    />
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
      className={cn(
        "group/sidebar hidden md:flex fixed left-0 top-20 z-40 flex-col",
        "h-[calc(100vh-var(--ait-header-h,5rem))] border-r border-border/60",
        "bg-background/95 backdrop-blur-xl py-3 overflow-y-auto overflow-x-hidden overscroll-contain",
        "w-[72px] hover:w-[220px] focus-within:w-[220px]",
        "hover:shadow-[4px_0_24px_rgba(0,0,0,0.35)] focus-within:shadow-[4px_0_24px_rgba(0,0,0,0.35)]",
        "transition-[width,box-shadow] duration-200 ease-out",
      )}
      aria-label="Основная навигация"
    >
      <NavSection items={sidebarPrimaryNav} activeFn={isActive} />
      <SectionDivider />
      <NavSection items={sidebarDiscoverNav} activeFn={isActive} />
      <SectionDivider />
      <NavSection items={extraItems} activeFn={isActive} />
    </aside>
  );
}
