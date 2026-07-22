import { toApiUrl } from "@/lib/queryClient";

/** Resolve stored media paths to absolute URLs for <img src>. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  // Never use ephemeral data: URLs as permanent avatar src.
  if (trimmed.startsWith("data:")) return undefined;
  if (trimmed.startsWith("/uploads/")) {
    return toApiUrl(trimmed);
  }
  if (trimmed.startsWith("/api/")) return toApiUrl(trimmed);
  return trimmed;
}

/**
 * Avatar-safe URL resolver: prefer resolveMediaUrl, but keep any already-working
 * stored path so a UI update never blank out existing photos.
 */
export function resolveAvatarSrc(src?: string | null): string | undefined {
  const resolved = resolveMediaUrl(src);
  if (resolved) return resolved;
  const raw = src?.trim();
  if (!raw || raw.startsWith("data:")) return undefined;
  return raw;
}
