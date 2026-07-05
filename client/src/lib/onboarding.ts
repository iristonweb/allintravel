import { apiRequestJson } from "@/lib/queryClient";

const ONBOARDING_KEY = "ait:onboarding-done";

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
}

/** Sync onboarding status from server; caches locally when complete. */
export async function fetchOnboardingDone(): Promise<boolean> {
  if (isOnboardingDone()) return true;
  try {
    const data = await apiRequestJson<{ completed: boolean }>("GET", "/api/onboarding/status");
    if (data.completed) markOnboardingDone();
    return data.completed;
  } catch {
    return isOnboardingDone();
  }
}

/** Mark onboarding complete locally and persist to server. */
export async function markOnboardingCompleteServer(): Promise<void> {
  markOnboardingDone();
  try {
    await apiRequestJson("POST", "/api/onboarding/complete");
  } catch {
    /* offline — local flag still set */
  }
}

export type OnboardingPrefs = {
  destination: string;
  startDate: string;
  endDate: string;
  travelStyle: "budget" | "luxury" | "adventure" | "balanced";
};

const PREFS_KEY = "ait:onboarding-prefs";

export function saveOnboardingPrefs(prefs: OnboardingPrefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadOnboardingPrefs(): OnboardingPrefs | null {
  const raw = localStorage.getItem(PREFS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OnboardingPrefs;
  } catch {
    return null;
  }
}
