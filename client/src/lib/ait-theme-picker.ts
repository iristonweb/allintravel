import { themeIdFromEntitlements, applyAitTheme, type AitThemeId } from "@/lib/ait-theme";

export const THEME_SKU_OPTIONS = [
  { sku: "theme_aurora", themeId: "aurora" as AitThemeId, labelKey: "ait.themes.aurora" },
  { sku: "theme_sakura", themeId: "sakura" as AitThemeId, labelKey: "ait.themes.sakura" },
  { sku: "theme_desert", themeId: "desert" as AitThemeId, labelKey: "ait.themes.desert" },
];

export function getOwnedThemeIds(skus: string[]): AitThemeId[] {
  const owned = new Set(skus);
  return THEME_SKU_OPTIONS.filter((o) => owned.has(o.sku)).map((o) => o.themeId);
}

export function getActiveThemeId(skus: string[]): AitThemeId {
  return themeIdFromEntitlements(skus);
}

export function selectAitTheme(themeId: AitThemeId, ownedSkus: string[]): boolean {
  if (themeId === "default") {
    applyAitTheme("default");
    return true;
  }
  const owned = getOwnedThemeIds(ownedSkus);
  if (!owned.includes(themeId)) return false;
  applyAitTheme(themeId);
  return true;
}

export function resolveThemeFromSkus(skus: string[]): void {
  applyAitTheme(themeIdFromEntitlements(skus));
}
