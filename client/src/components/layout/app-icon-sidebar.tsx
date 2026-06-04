import { Link, useLocation } from "wouter";
import { Calendar, Home, Map, MessageCircle, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const items = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/map", label: "Карта", icon: Map },
  { href: "/trips", label: "Планирование", icon: Calendar },
  { href: "/social-feed", label: "Сообщество", icon: Users },
  { href: "/messages", label: "Сообщения", icon: MessageCircle },
  { href: "/profile", label: "Профиль", icon: User },
];

export default function AppIconSidebar() {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-[72px] flex-col items-center gap-2 border-r border-border/60 bg-background/40 backdrop-blur-xl py-4">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? location === "/"
            : location === item.href || location.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link href={item.href}>
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl transition-all",
                    active
                      ? "ait-nav-active text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </aside>
  );
}
