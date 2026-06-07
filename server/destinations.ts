import type { IStorage } from "./storage";
import type { Event, Place, TravelPostWithAuthor, Trip } from "@shared/schema";

export type DestinationPageData = {
  slug: string;
  name: string;
  places: Place[];
  trips: Trip[];
  events: Event[];
  posts: TravelPostWithAuthor[];
};

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9а-яё-]/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function destinationSlugFromName(name: string): string {
  return slugify(name.split(",")[0]?.trim() || name);
}

function matchesDestination(text: string | null | undefined, slug: string, name: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const city = name.toLowerCase();
  return lower.includes(city) || slugify(lower).includes(slug) || slug.includes(slugify(lower));
}

export async function listDestinationSlugs(storage: IStorage, limit = 80): Promise<string[]> {
  const trips = await storage.getTrips({ limit: 120 });
  const places = await storage.getPlaces({ limit: 120 });
  const slugs = new Set<string>();
  for (const t of trips) {
    const s = destinationSlugFromName(t.destination);
    if (s) slugs.add(s);
  }
  for (const p of places) {
    if (p.address) {
      const s = destinationSlugFromName(p.address);
      if (s) slugs.add(s);
    }
  }
  return Array.from(slugs).slice(0, limit);
}

export async function getDestinationPage(
  storage: IStorage,
  slug: string,
): Promise<DestinationPageData | null> {
  const allTrips = await storage.getTrips({ limit: 100 });
  const matchingTrip = allTrips.find((t) => destinationSlugFromName(t.destination) === slug);
  const name =
    matchingTrip?.destination.split(",")[0]?.trim() ||
    slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const places = (await storage.getPlaces({ search: name, limit: 12 })).filter((p) =>
    matchesDestination(p.address ?? p.name, slug, name),
  );

  const trips = allTrips
    .filter((t) => destinationSlugFromName(t.destination) === slug && t.isPublic)
    .slice(0, 8);

  const events = (await storage.getEvents({ upcoming: true, limit: 40 })).filter((e) =>
    matchesDestination(e.location, slug, name),
  );

  const rawPosts = await storage.getTravelPosts({ publicOnly: true, limit: 30 });
  const posts: TravelPostWithAuthor[] = (
    await Promise.all(
      rawPosts.map(async (post) => {
        const author = post.userId ? await storage.getUser(post.userId) : null;
        return {
          ...post,
          author: author
            ? {
                id: author.id,
                firstName: author.firstName,
                lastName: author.lastName,
                profileImageUrl: author.profileImageUrl,
              }
            : null,
          likesCount: 0,
          commentsCount: 0,
          isLiked: false,
        } as TravelPostWithAuthor;
      }),
    )
  ).filter((p) => matchesDestination(p.location ?? p.title, slug, name));

  if (places.length === 0 && trips.length === 0 && events.length === 0 && posts.length === 0) {
    return null;
  }

  return { slug, name, places, trips, events: events.slice(0, 6), posts: posts.slice(0, 6) };
}
