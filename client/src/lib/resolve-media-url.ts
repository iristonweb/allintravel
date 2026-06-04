/** URLs saved as /uploads/... on Vercel are ephemeral — ignore for display. */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url?.trim()) return undefined;
  const trimmed = url.trim();
  if (trimmed.startsWith("/uploads/")) return undefined;
  return trimmed;
}
