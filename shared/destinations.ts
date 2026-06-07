import type { Event, Place, TravelPostWithAuthor, Trip } from "./schema";

export type DestinationPageData = {
  slug: string;
  name: string;
  places: Place[];
  trips: Trip[];
  events: Event[];
  posts: TravelPostWithAuthor[];
};
