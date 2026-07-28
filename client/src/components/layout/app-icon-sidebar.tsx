import { Link, useLocation } from "wouter";
import { MapPin, Sparkles } from "lucide-react";
import AitButton from "@/components/ait-ui/AitButton";
import AitSurface from "@/components/ait-ui/AitSurface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { resolveAvatarSrc } from "@/lib/resolve-media-url";
import { useAuth } from "@/hooks/useAuth";
import { useNavLabels } from "@/hooks/useNavLabels";
import { useUrlSearch } from "@/hooks/useUrlSearch";
import { isCommunityHubRoute, isNavActive, matchNavHref } from "@/lib/nav-groups";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

export const SIDEBAR_WIDTH_COLLAPSED = 72;
export const SIDEBAR_WIDTH_EXPANDED = 240;

type NavItemWithMeta = {
  href: string;
  label: string;
  badge?: string;
  icon?: LucideIcon;
};

function NavItem({
  item,
  active,
  labelsVisible,
}: {
  item: NavItemWithMeta;
  active: boolean;
  labelsVisible: boolean;
}) {
  const Icon = item.icon ?? MapPin;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        className={cn(
          "relative flex h-11 w-full items-center gap-3 rounded-xl px-2.5 transition-colors duration-200",
          active
            ? "bg-primary/10 text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-7 before:w-0.5 before:rounded-full before:bg-primary before:content-['']"
            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
          !labelsVisible &&
            "group-hover/sidebar:hover:bg-muted/50 group-hover/sidebar:hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200",
            active ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium transition-all duration-200 ease-out",
            labelsVisible
              ? "opacity-100 max-w-[180px]"
              : "opacity-0 max-w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[180px] group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-w-[180px]",
          )}
        >
          {item.label}
        </span>
        {item.badge && (
          <span
            className={cn(
              "shrink-0 rounded-md bg-ait-purple/30 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ait-orange transition-all duration-200",
              labelsVisible
                ? "opacity-100 max-w-[3rem]"
                : "opacity-0 max-w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[3rem] group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-w-[3rem]",
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
  labelsVisible,
}: {
  label: string;
  items: NavItemWithMeta[];
  activeFn: (href: string) => boolean;
  labelsVisible: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5 w-full">
      <p
        className={cn(
          "px-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 transition-all duration-200",
          labelsVisible
            ? "opacity-100 max-h-8"
            : "opacity-0 max-h-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-h-8 group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-h-8",
        )}
      >
        {label}
      </p>
      {items.map((item) => (
        <NavItem
          key={`${item.href}-${item.label}`}
          item={item}
          active={activeFn(item.href)}
          labelsVisible={labelsVisible}
        />
      ))}
    </div>
  );
}

function SectionDivider({ wide }: { wide?: boolean }) {
  return (
    <div
      className={cn(
        "my-2 shrink-0 border-t border-white/10 transition-all duration-200",
        wide
          ? "w-[calc(100%-1rem)] mx-2"
          : "w-10 mx-auto group-hover/sidebar:w-[calc(100%-1rem)] group-hover/sidebar:mx-2 group-focus-within/sidebar:w-[calc(100%-1rem)] group-focus-within/sidebar:mx-2",
      )}
      aria-hidden
    />
  );
}

type AppIconSidebarProps = {
  minimalChrome?: boolean;
};

function SidebarCollapsedAvatar() {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim() ||
    user.username?.[0]?.toUpperCase() ||
    "?";

  return (
    <Link
      href="/profile"
      aria-label={t("nav.profile")}
      className="flex justify-center py-2 mb-1 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background group-hover/sidebar:hidden group-focus-within/sidebar:hidden"
    >
      <Avatar className="h-9 w-9 border border-border/50">
        <AvatarImage src={resolveAvatarSrc(user.profileImageUrl)} alt="" />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
}

function SidebarUserPreview({ expanded }: { expanded: boolean }) {
  const { user } = useAuth();
  const { t } = useTranslation();
  if (!user) return null;

  const displayName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.username || t("nav.profile");
  const initials =
    `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim() ||
    user.username?.[0]?.toUpperCase() ||
    "?";

  return (
    <Link
      href="/profile"
      className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span
        className={cn(
          "flex items-center gap-3 rounded-xl px-2.5 py-2 mb-2 transition-colors duration-200 hover:bg-muted/50",
          expanded
            ? "opacity-100"
            : "opacity-0 max-h-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-h-16 group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-h-16",
        )}
      >
        <Avatar className="h-9 w-9 border border-border/50 shrink-0">
          <AvatarImage src={resolveAvatarSrc(user.profileImageUrl)} alt="" />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {initials}
          </AvatarFallback>
        </Avatar>
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-medium text-foreground transition-all duration-200",
            expanded
              ? "opacity-100 max-w-[180px]"
              : "opacity-0 max-w-0 overflow-hidden group-hover/sidebar:opacity-100 group-hover/sidebar:max-w-[180px] group-focus-within/sidebar:opacity-100 group-focus-within/sidebar:max-w-[180px]",
          )}
        >
          {displayName}
        </span>
      </span>
    </Link>
  );
}

export default function AppIconSidebar({ minimalChrome }: AppIconSidebarProps) {
  const [location] = useLocation();
  const search = useUrlSearch();
  const { navGroups, communitySidebarItems } = useNavLabels();
  const { t } = useTranslation();
  const { user } = useAuth();
  const communityMode = isCommunityHubRoute(location);
  const labelsVisible = communityMode;
  const isPremium = Boolean(user?.isPremium);

  const communityActiveFn = (href: string) => matchNavHref(location, search, href);

  return (
    <aside
      className={cn(
        "group/sidebar hidden md:flex fixed left-0 top-[var(--ait-header-h,4.5rem)] z-40 flex-col",
        "h-[calc(100vh-var(--ait-header-h,4.5rem))] py-3 overflow-y-auto overflow-x-hidden overscroll-contain",
        "transition-[width,box-shadow] duration-250 ease-out",
        communityMode
          ? "w-[240px] shadow-[4px_0_32px_rgba(139,92,246,0.08)]"
          : "w-[72px] hover:w-[240px] focus-within:w-[240px] hover:shadow-[4px_0_32px_rgba(139,92,246,0.08)] focus-within:shadow-[4px_0_32px_rgba(139,92,246,0.08)]",
        minimalChrome ? "ait-chrome-minimal-sidebar" : "ait-chrome-solid-sidebar backdrop-blur-xl",
      )}
      aria-label={t("nav.ariaLabel", { defaultValue: "Main navigation" })}
    >
      <div className="flex-1 flex flex-col gap-0.5">
        {communityMode ? (
          <NavSection
            label={t("nav.groups.share")}
            items={communitySidebarItems}
            activeFn={communityActiveFn}
            labelsVisible={labelsVisible}
          />
        ) : (
          navGroups.map((group, index) => (
            <div key={group.id}>
              {index > 0 && <SectionDivider />}
              <NavSection
                label={group.label}
                items={group.items}
                activeFn={(href) => isNavActive(location, href)}
                labelsVisible={false}
              />
            </div>
          ))
        )}
      </div>

      <div
        className={cn(
          "mt-auto px-2 pt-3 shrink-0 transition-all duration-250",
          communityMode
            ? "opacity-100 max-h-64"
            : "opacity-100 max-h-64 group-hover/sidebar:opacity-100 group-focus-within/sidebar:opacity-100",
        )}
      >
        {!communityMode && <SidebarCollapsedAvatar />}
        <div
          className={cn(
            communityMode
              ? "block"
              : "hidden group-hover/sidebar:block group-focus-within/sidebar:block",
          )}
        >
          <SidebarUserPreview expanded={communityMode} />
          <AitSurface
            padding="sm"
            radius="lg"
            glow
            className={cn(
              "mx-0.5 border",
              isPremium ? "border-emerald-500/30" : "border-amber-500/20",
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Sparkles
                className={cn(
                  "h-4 w-4 shrink-0",
                  isPremium ? "text-emerald-400" : "text-ait-orange",
                )}
              />
              <p className="text-xs font-bold text-foreground truncate">
                {t("nav.premiumTitle", { defaultValue: "AllInTravel Premium" })}
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-3 leading-snug">
              {isPremium
                ? t("nav.premiumActiveHint", {
                    defaultValue: "Premium active — AI tools & rewards unlocked",
                  })
                : t("nav.premiumHint")}
            </p>
            {isPremium ? (
              <div className="flex h-8 w-full items-center justify-center rounded-lg bg-emerald-500/15 text-xs font-semibold text-emerald-300">
                {t("nav.premiumActive", { defaultValue: "Active" })}
              </div>
            ) : (
              <AitButton variant="primary" size="sm" className="w-full h-8 text-xs" asChild>
                <Link href="/premium">
                  {t("nav.premiumSubscribe", { defaultValue: "Subscribe" })}
                </Link>
              </AitButton>
            )}
          </AitSurface>
        </div>
      </div>
    </aside>
  );
}
