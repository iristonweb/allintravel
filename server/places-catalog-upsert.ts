import { sql } from "drizzle-orm";

import { places } from "@shared/schema";

import type { getDb } from "./db";
import { buildPlacesCatalog } from "./places-catalog";
import { withRetry } from "./bulk-import";

export const PLACES_CATALOG_CHUNK_SIZE = 15;

type Db = NonNullable<ReturnType<typeof getDb>>;

export async function upsertPlacesCatalog(
  db: Db,
  opts?: { onProgress?: (done: number, total: number) => void; resilient?: boolean },
): Promise<number> {
  const catalog = buildPlacesCatalog();
  const chunkSize = PLACES_CATALOG_CHUNK_SIZE;
  const resilient = opts?.resilient ?? false;
  let upserted = 0;

  const runBatch = async (batch: ReturnType<typeof buildPlacesCatalog>) => {
    await db
      .insert(places)
      .values(
        batch.map((p) => ({
          ...p,
          phone: null,
          website: null,
          amenities: null,
        })),
      )
      .onConflictDoUpdate({
        target: places.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          type: sql`excluded.type`,
          latitude: sql`excluded.latitude`,
          longitude: sql`excluded.longitude`,
          address: sql`excluded.address`,
          imageUrl: sql`excluded.image_url`,
          priceRange: sql`excluded.price_range`,
          cuisine: sql`excluded.cuisine`,
          averageRating: sql`excluded.average_rating`,
          reviewCount: sql`excluded.review_count`,
          isVerified: sql`excluded.is_verified`,
          updatedAt: new Date(),
        },
      });
  };

  for (let i = 0; i < catalog.length; i += chunkSize) {
    const batch = catalog.slice(i, i + chunkSize);
    const label = `places batch ${i / chunkSize + 1}`;

    if (resilient) {
      await withRetry(label, () => runBatch(batch));
    } else {
      await runBatch(batch);
    }

    upserted += batch.length;
    opts?.onProgress?.(upserted, catalog.length);
  }

  return catalog.length;
}
