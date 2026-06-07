const ONBOARDING_KEY = "ait:onboarding-done";

export function isOnboardingDone(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === "1";
}

export function markOnboardingDone(): void {
  localStorage.setItem(ONBOARDING_KEY, "1");
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
