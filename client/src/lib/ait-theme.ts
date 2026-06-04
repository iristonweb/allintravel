const THEME_KEY = "ait-active-theme";

export type AitThemeId = "default" | "aurora" | "sakura" | "desert";

const SKU_TO_THEME: Record<string, AitThemeId> = {
  theme_aurora: "aurora",
  theme_sakura: "sakura",
  theme_desert: "desert",
};

export function themeIdFromEntitlements(skus: string[]): AitThemeId {
  for (const sku of skus) {
    const t = SKU_TO_THEME[sku];
    if (t) return t;
  }
  return (localStorage.getItem(THEME_KEY) as AitThemeId) || "default";
}

export function applyAitTheme(themeId: AitThemeId): void {
  const root = document.documentElement;
  if (themeId === "default") {
    root.removeAttribute("data-ait-theme");
    localStorage.removeItem(THEME_KEY);
  } else {
    root.setAttribute("data-ait-theme", themeId);
    localStorage.setItem(THEME_KEY, themeId);
  }
}

export function resolveThemeFromSkus(skus: string[]): void {
  applyAitTheme(themeIdFromEntitlements(skus));
}
