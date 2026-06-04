/** URLs saved as /uploads/... on Vercel are ephemeral — ignore for display in production. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("/api/media/blob?")) return trimmed;
  if (trimmed.startsWith("/uploads/")) {
    if (import.meta.env.PROD) return undefined;
    return trimmed;
  }
  if (trimmed.startsWith("data:")) return undefined;
  return trimmed;
}
