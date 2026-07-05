import { Link, useLocation } from "wouter";
import { MapPin, Sparkles } from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { cn } from "@/lib/utils";
import { useNavLabels } from "@/hooks/useNavLabels";
import { isNavActive } from "@/lib/nav-groups";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_WIDTH_EXPANDED = 220;

type NavItemWithMeta = { href: string; label: string; badge?: string; icon?: LucideIcon };

function NavItem({ item, active }: { item: NavItemWithMeta; active: boolean }) {
  const Icon = item.icon ?? MapPin;
  return (
    <Link href={item.href}>
      <span
        className={cn(
          "relative flex h-11 w-full items-center gap-3 rounded-xl px-2.5 transition-all duration-250 ease-out",
          active
            ? "text-white bg-gradient-to-r from-ait-purple/25 to-ait-orange/10 shadow-ait-glow-purple/40 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.25)]"
            : "text-slate-300 hover:bg-white/8 hover:text-white group-hover/sidebar:hover:bg-white/8 group-hover/sidebar:hover:text-white",
          active &&
            "before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-7 before:w-1 before:rounded-full before:bg-gradient-to-b before:from-ait-purple before:to-ait-orange before:content-['']",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-250",
            active
              ? "bg-ait-purple/30 text-white scale-105"
              : "bg-white/[0.07] text-slate-200 group-hover:scale-105",
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
  label: string;
  items: NavItemWithMeta[];
  activeFn: (href: string) => boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
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
};

export default function AppIconSidebar({ minimalChrome }: AppIconSidebarProps) {
  const [location] = useLocation();
  const { navGroups } = useNavLabels();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "group/sidebar hidden md:flex fixed left-0 top-[var(--ait-header-h,4.5rem)] z-40 flex-col",
        "h-[calc(100vh-var(--ait-header-h,4.5rem))] py-3 overflow-y-auto overflow-x-hidden overscroll-contain",
        "w-[72px] hover:w-[220px] focus-within:w-[220px]",
        "transition-[width,box-shadow] duration-250 ease-out",
        minimalChrome
          ? "ait-chrome-minimal-sidebar"
          : "ait-chrome-solid-sidebar backdrop-blur-xl hover:shadow-[4px_0_32px_rgba(139,92,246,0.08)] focus-within:shadow-[4px_0_32px_rgba(139,92,246,0.08)]",
      )}
      aria-label="Основная навигация"
    >
      <div className="flex-1 flex flex-col gap-0.5">
        {navGroups.map((group, index) => (
          <div key={group.id}>
            {index > 0 && <SectionDivider />}
            <NavSection
              label={group.label}
              items={group.items}
              activeFn={(href) => isNavActive(location, href)}
            />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-auto px-2 pt-3 shrink-0",
          "opacity-0 max-h-0 overflow-hidden transition-all duration-250",
          "group-hover/sidebar:opacity-100 group-hover/sidebar:max-h-40",
          "group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-h-40",
        )}
      >
        <AitSurface padding="sm" radius="lg" glow className="mx-0.5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-ait-orange shrink-0" />
            <p className="text-xs font-bold text-white truncate">Premium</p>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3 leading-snug">
            {t("nav.premiumHint", { defaultValue: "Unlock AI tools & rewards" })}
          </p>
          <AitButton variant="primary" size="sm" className="w-full h-8 text-xs" asChild>
            <Link href="/wallet">{t("nav.upgrade", { defaultValue: "Upgrade" })}</Link>
          </AitButton>
        </AitSurface>
      </div>
    </aside>
  );
}
