import { Link, useLocation } from "wouter";
import { Home, Map, MessageCircle, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const items = [
  { href: "/", icon: Home, label: "Главная" },
  { href: "/map", icon: Map, label: "Карта" },
  { href: "/trips", icon: Plus, label: "", fab: true },
  { href: "/messages", icon: MessageCircle, label: "Чаты" },
  { href: "/profile", icon: User, label: "Профиль" },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
      <div className="ait-glass-strong rounded-[32px] px-2 py-2 flex items-center justify-around border border-white/10 shadow-2xl">
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
                <motion.span
                  className="flex -mt-8 h-14 w-14 items-center justify-center rounded-[20px] ait-btn-glow text-white"
                  whileTap={{ scale: 0.92 }}
                >
                  <Icon className="h-7 w-7" strokeWidth={2.5} />
                </motion.span>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <span
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-2xl transition-colors",
                  active ? "text-white" : "text-slate-500",
                )}
              >
                <Icon className={cn("h-5 w-5", active && "text-[#8b5cf6]")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
