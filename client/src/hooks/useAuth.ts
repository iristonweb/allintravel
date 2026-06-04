import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

async function fetchAuthUser(): Promise<User | null> {
  const res = await fetch("/api/auth/user", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as User;
}

export function useAuth() {
  const { data: user, isPending } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchAuthUser,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user: user ?? undefined,
    isLoading: isPending,
    isAuthenticated: !!user,
  };
}
