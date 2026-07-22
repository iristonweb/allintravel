import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import i18n from "@/i18n";

async function fetchAuthUser(): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/user", { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as User;
  } catch {
    return null;
  }
}

function normalizeLocale(raw?: string | null): "en" | "ru" | null {
  if (!raw) return null;
  if (raw.startsWith("en")) return "en";
  if (raw.startsWith("ru")) return "ru";
  return null;
}

export function useAuth() {
  const { data: user, isPending } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchAuthUser,
    retry: false,
    refetchOnWindowFocus: true,
    staleTime: 60_000,
  });

  useEffect(() => {
    const preferred = normalizeLocale(user?.preferredLocale);
    if (!preferred) return;
    const current = i18n.language?.startsWith("en") ? "en" : "ru";
    if (current !== preferred) {
      void i18n.changeLanguage(preferred);
    }
  }, [user?.preferredLocale]);

  return {
    user: user ?? undefined,
    isLoading: isPending,
    isAuthenticated: !!user,
  };
}
