import { toApiUrl } from "@/lib/queryClient";

/** Resolve stored media paths to absolute URLs for <img src>. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:")) return undefined;
  if (trimmed.startsWith("/uploads/")) {
    return toApiUrl(trimmed);
  }
  if (trimmed.startsWith("/api/")) return toApiUrl(trimmed);
  return trimmed;
}
