import { Link } from "wouter";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/resolve-media-url";
import { getUserDisplayLabel, getUserInitial } from "@shared/user-display";

type AvatarHubMenuProps = {
  user: {
    firstName?: string | null;
    lastName?: string | null;
    displayName?: string | null;
    profileImageUrl?: string | null;
  } | null;
  hasUnreadBadge?: boolean;
  onLogout: () => void;
};

/** Минимальное меню: всё остальное — в сайдбаре слева */
export default function AvatarHubMenu({ user, hasUnreadBadge, onLogout }: AvatarHubMenuProps) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 180);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => () => clearCloseTimer(), []);

  const label = user ? getUserDisplayLabel(user) : "Аккаунт";

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        clearCloseTimer();
        if (window.matchMedia("(hover: hover)").matches) setOpen(true);
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) scheduleClose();
      }}
    >
      <Button
        type="button"
        variant="ghost"
        className="relative rounded-2xl p-1 h-11 w-11 hover:bg-white/8"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Аккаунт"
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar className="h-9 w-9 border-2 border-white/20 ait-neon-purple">
          <AvatarImage src={resolveMediaUrl(user?.profileImageUrl)} />
          <AvatarFallback className="bg-gradient-to-br from-[#8b5cf6] to-[#ff7a18] text-xs text-white">
            {user ? getUserInitial(user) : "U"}
          </AvatarFallback>
        </Avatar>
        {hasUnreadBadge && (
          <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-[#ff7a18] ring-2 ring-[#050816]" />
        )}
      </Button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[59] md:hidden bg-black/20"
            aria-label="Закрыть меню"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 top-full z-[60] pt-2",
              "w-[min(260px,calc(100vw-1.5rem))]",
            )}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={scheduleClose}
          >
            <div className="rounded-2xl ait-glass-strong border border-white/10 shadow-2xl overflow-hidden p-2">
              <p className="px-2 py-1.5 text-sm font-medium truncate">{label}</p>
              <p className="px-2 pb-2 text-xs text-muted-foreground">Разделы — в меню слева</p>
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="block w-full text-left px-2 py-2 rounded-lg text-sm hover:bg-white/8"
              >
                Открыть профиль
              </Link>
              <button
                type="button"
                className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-slate-300 hover:text-white hover:bg-white/8 w-full text-left mt-1"
                onClick={() => {
                  setOpen(false);
                  void onLogout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Выйти
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
