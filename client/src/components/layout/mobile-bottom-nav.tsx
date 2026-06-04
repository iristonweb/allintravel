import { Link, useLocation } from "wouter";
import { Calendar, Home, Map, MessageCircle, Plus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", icon: Home, label: "Главная" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/trips", icon: Plus, label: "Создать", fab: true },
  { href: "/social-feed", icon: Users, label: "Лента" },
  { href: "/messages", icon: MessageCircle, label: "Чат" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-background/90 backdrop-blur-xl px-2 pb-safe pt-2">
      <div className="flex items-end justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            !item.fab &&
            (item.href === "/"
              ? location === "/"
              : location === item.href || location.startsWith(`${item.href}/`));

          if (item.fab) {
            return (
              <Link key={item.href} href={item.href}>
                <span className="flex -mt-6 h-14 w-14 items-center justify-center rounded-full bg-ait-gradient-cta text-white shadow-ait-glow-purple">
                  <Icon className="h-6 w-6" />
                </span>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px]",
                  active ? "text-ait-purple" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
