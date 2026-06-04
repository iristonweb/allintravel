const REFERRAL_PENDING_KEY = "ait:pending-referral";

export function captureReferralFromUrl(): void {
  if (typeof window === "undefined") return;
  const ref = new URLSearchParams(window.location.search).get("ref");
  if (!ref?.trim()) return;
  localStorage.setItem(REFERRAL_PENDING_KEY, ref.trim().toUpperCase());
}

export function getPendingReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFERRAL_PENDING_KEY);
}

export function clearPendingReferralCode(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFERRAL_PENDING_KEY);
}

export function referralShareUrl(code: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/login?ref=${encodeURIComponent(code)}`;
}
