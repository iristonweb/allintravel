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
  Music,
  Settings,
  PenLine,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  sidebarPrimaryNav,
  sidebarDiscoverNav,
  sidebarExtraNav,
  sidebarAccountNav,
  type SidebarNavItem,
} from "@/lib/nav-config";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_WIDTH_EXPANDED = 220;

const iconByHref: Record<string, LucideIcon> = {
  "/": Home,
  "/map": Map,
  "/trips": Calendar,
  "/social-feed": Users,
  "/friends": Users,
  "/messages": MessageCircle,
  "/places": MapPin,
  "/events": Sparkles,
  "/blog": BookOpen,
  "/wallet": Wallet,
  "/chat": MessageSquare,
  "/profile/music": Music,
  "/profile": User,
  "/profile/edit": PenLine,
  "/profile/settings": Settings,
  "/admin": Shield,
};

type NavItemWithMeta = { href: string; label: string; badge?: string; icon?: LucideIcon };

function NavItem({
  item,
  active,
}: {
  item: NavItemWithMeta;
  active: boolean;
}) {
  const Icon = item.icon ?? iconByHref[item.href] ?? MapPin;
  return (
    <Link href={item.href}>
      <span
        className={cn(
          "relative flex h-11 w-full items-center gap-3 rounded-xl px-2.5 transition-colors",
          active
            ? "text-white bg-white/12 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
            : "text-slate-300 hover:bg-white/8 hover:text-white group-hover/sidebar:hover:bg-white/8 group-hover/sidebar:hover:text-white",
          active &&
            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-7 before:w-1 before:rounded-full before:bg-ait-purple before:content-['']",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            active ? "bg-ait-purple/25 text-white" : "bg-white/[0.07] text-slate-200",
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
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
  label,
  items,
  activeFn,
}: {
  label?: string;
  items: NavItemWithMeta[];
  activeFn: (href: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      {label && (
        <p
          className={cn(
            "px-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1",
            "opacity-0 max-h-0 overflow-hidden transition-all duration-200",
            "group-hover/sidebar:opacity-100 group-hover/sidebar:max-h-8",
            "group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-h-8",
          )}
        >
          {label}
        </p>
      )}
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

type AppIconSidebarProps = {
  minimalChrome?: boolean;
  transparentChrome?: boolean;
};

function sidebarChromeClass(minimalChrome?: boolean, transparentChrome?: boolean) {
  if (transparentChrome) return "ait-chrome-transparent-sidebar";
  if (minimalChrome) return "ait-chrome-minimal-sidebar";
  return "ait-chrome-solid-sidebar backdrop-blur-xl hover:shadow-[4px_0_24px_rgba(0,0,0,0.35)] focus-within:shadow-[4px_0_24px_rgba(0,0,0,0.35)]";
}

export default function AppIconSidebar({ minimalChrome, transparentChrome }: AppIconSidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    if (href === "/profile") return location === "/profile";
    if (href === "/friends") return location === "/friends" || location.startsWith("/profile/friends");
    return location === href || location.startsWith(`${href}/`);
  };

  const extraItems: NavItemWithMeta[] = sidebarExtraNav.map((item) =>
    item.href === "/wallet" ? { ...item, badge: item.badge ?? "AIT" } : item,
  );

  const accountItems: NavItemWithMeta[] = [
    ...sidebarAccountNav,
    ...(user?.isAdmin ? [{ href: "/admin", label: "Админ", icon: Shield }] : []),
  ];

  return (
    <aside
      className={cn(
        "group/sidebar hidden md:flex fixed left-0 top-20 z-40 flex-col",
        "h-[calc(100vh-var(--ait-header-h,5rem))] py-3 overflow-y-auto overflow-x-hidden overscroll-contain",
        "w-[72px] hover:w-[220px] focus-within:w-[220px]",
        "transition-[width,box-shadow] duration-200 ease-out",
        sidebarChromeClass(minimalChrome, transparentChrome),
      )}
      aria-label="Основная навигация"
    >
      <NavSection items={sidebarPrimaryNav} activeFn={isActive} />
      <SectionDivider />
      <NavSection label="Каталог" items={sidebarDiscoverNav} activeFn={isActive} />
      <SectionDivider />
      <NavSection items={extraItems} activeFn={isActive} />
      <SectionDivider />
      <NavSection label="Аккаунт" items={accountItems} activeFn={isActive} />
    </aside>
  );
}
