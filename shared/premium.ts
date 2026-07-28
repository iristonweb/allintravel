/** Platform Premium plans priced in AIT (no card billing in this pass). */

export type PremiumPlanId = "month" | "year" | "lifetime";

export type PremiumPlan = {
  id: PremiumPlanId;
  /** AIT cost */
  costAit: number;
  /** Days of access; null = lifetime */
  durationDays: number | null;
  titleKey: string;
  titleDefault: string;
  descriptionKey: string;
  descriptionDefault: string;
};

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: "month",
    costAit: 5_000,
    durationDays: 30,
    titleKey: "premium.plans.month.title",
    titleDefault: "1 month",
    descriptionKey: "premium.plans.month.desc",
    descriptionDefault: "Full Premium chrome, badge, and perk entitlements for 30 days",
  },
  {
    id: "year",
    costAit: 40_000,
    durationDays: 365,
    titleKey: "premium.plans.year.title",
    titleDefault: "1 year",
    descriptionKey: "premium.plans.year.desc",
    descriptionDefault: "Best value — a full year of Premium",
  },
  {
    id: "lifetime",
    costAit: 120_000,
    durationDays: null,
    titleKey: "premium.plans.lifetime.title",
    titleDefault: "Lifetime",
    descriptionKey: "premium.plans.lifetime.desc",
    descriptionDefault: "One-time unlock — Premium forever",
  },
];

export function getPremiumPlan(id: string): PremiumPlan | undefined {
  return PREMIUM_PLANS.find((p) => p.id === id);
}
