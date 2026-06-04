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
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const mainItems = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/map", label: "Карта", icon: Map },
  { href: "/trips", label: "Планирование", icon: Calendar },
  { href: "/social-feed", label: "Сообщество", icon: Users },
  { href: "/messages", label: "Сообщения", icon: MessageCircle },
  { href: "/profile", label: "Профиль", icon: User },
];

const serviceItems = [
  { href: "/places", label: "Места", icon: MapPin },
  { href: "/events", label: "События", icon: Sparkles },
  { href: "/blog", label: "Блог", icon: BookOpen },
  { href: "/wallet", label: "Кошелёк", icon: Wallet, badge: "Demo" },
];

function NavIcon({
  item,
  active,
}: {
  item: (typeof mainItems)[0] & { badge?: string };
  active: boolean;
}) {
  const Icon = item.icon;
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

export default function AppIconSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/"
      ? location === "/"
      : location === href || location.startsWith(`${href}/`);

  return (
    <aside className="hidden md:flex fixed left-0 top-20 z-40 h-[calc(100vh-5rem)] w-[72px] flex-col items-center gap-1 border-r border-border/60 bg-background/40 backdrop-blur-xl py-4">
      {mainItems.map((item) => (
        <NavIcon key={item.href} item={item} active={isActive(item.href)} />
      ))}
      <div className="w-8 border-t border-white/10 my-2" />
      {serviceItems.map((item) => (
        <NavIcon key={item.href} item={item} active={isActive(item.href)} />
      ))}
    </aside>
  );
}
