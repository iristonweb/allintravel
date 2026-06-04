import { toApiUrl } from "@/lib/queryClient";

/** URLs saved as /uploads/... on Vercel are ephemeral — ignore for display in production. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return undefined;
  if (trimmed.startsWith("/uploads/")) {
    if (import.meta.env.PROD) return undefined;
    return toApiUrl(trimmed);
  }
  if (trimmed.startsWith("/api/")) return toApiUrl(trimmed);
  return trimmed;
}
