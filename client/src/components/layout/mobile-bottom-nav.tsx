import { Link, useLocation } from "wouter";
import {
  BookOpen,
  Home,
  Map,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Sparkles,
  Users,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainItems = [
  { href: "/", icon: Home, label: "Главная" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/trips", icon: Plus, label: "", fab: true },
  { href: "/messages", icon: MessageCircle, label: "Чаты" },
] as const;

const ecosystemItems = [
  { href: "/places", icon: MapPin, label: "Места" },
  { href: "/events", icon: Sparkles, label: "События" },
  { href: "/blog", icon: BookOpen, label: "Блог" },
  { href: "/wallet", icon: Wallet, label: "Кошелёк", badge: "Demo" },
  { href: "/social-feed", icon: Users, label: "Лента" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  const isActive = (href: string) =>
    href === "/"
      ? location === "/"
      : location === href || location.startsWith(`${href}/`);

  const ecosystemActive = ecosystemItems.some((item) => isActive(item.href));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-3 pb-4 pt-2">
      <div className="ait-glass-strong rounded-[28px] px-1.5 py-2 flex items-center justify-between border border-white/10 shadow-2xl max-w-lg mx-auto">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = !("fab" in item) && isActive(item.href);

          if ("fab" in item && item.fab) {
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
                <span className="text-[9px] font-medium truncate max-w-full px-0.5">{item.label}</span>
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
            {ecosystemItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <DropdownMenuItem className="cursor-pointer gap-2">
                    <Icon className="h-4 w-4 text-ait-purple" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold text-ait-orange">{item.badge}</span>
                    )}
                  </DropdownMenuItem>
                </Link>
              );
            })}
            <Link href="/profile">
              <DropdownMenuItem className="cursor-pointer gap-2">
                <User className="h-4 w-4" />
                Профиль
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
