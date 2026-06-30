import { sql } from "drizzle-orm";
import { getDb } from "../../db";
import { storage } from "../../storage";
import { getPassportForUser } from "../../modules/passport/service";

export type ProofOfExperience = {
  verified: boolean;
  countryMatch: boolean;
  hasGeoPosts: boolean;
  hasReviews: boolean;
  badge: "verified_experience" | "unverified";
  discountMultiplier: number;
};

export async function checkProofOfExperience(
  userId: string,
  postCountry?: string | null,
): Promise<ProofOfExperience> {
  const passport = await getPassportForUser(storage, userId, false);
  const countries = new Set(passport.stamps.map((s) => s.countryName.toLowerCase()));

  const countryMatch = Boolean(postCountry && countries.has(postCountry.toLowerCase()));

  const db = getDb();
  let hasGeoPosts = false;
  let hasReviews = false;

  if (db) {
    const geoRes = await db.execute(sql`
      SELECT 1 FROM travel_posts
      WHERE user_id = ${userId} AND location IS NOT NULL AND location != ''
      LIMIT 1
    `);
    hasGeoPosts = ((geoRes as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;

    const revRes = await db.execute(sql`
      SELECT 1 FROM reviews WHERE user_id = ${userId} LIMIT 1
    `);
    hasReviews = ((revRes as unknown as { rows?: unknown[] }).rows?.length ?? 0) > 0;
  } else {
    hasGeoPosts = passport.stamps.length > 0;
  }

  const verified = countryMatch || (hasGeoPosts && passport.countriesCount > 0) || hasReviews;

  return {
    verified,
    countryMatch,
    hasGeoPosts,
    hasReviews,
    badge: verified ? "verified_experience" : "unverified",
    discountMultiplier: verified ? 0.6 : 3,
  };
}
