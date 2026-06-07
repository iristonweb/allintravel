import { describe, expect, it } from "vitest";
import { haversineKm, totalRouteKm, optimizeWaypointOrder } from "./routeUtils";

describe("routeUtils", () => {
  it("haversineKm returns positive distance", () => {
    const km = haversineKm(55.75, 37.62, 59.93, 30.31);
    expect(km).toBeGreaterThan(600);
    expect(km).toBeLessThan(700);
  });

  it("totalRouteKm sums segments", () => {
    const coords: [number, number][] = [
      [55.75, 37.62],
      [59.93, 30.31],
    ];
    expect(totalRouteKm(coords)).toBe(Math.round(haversineKm(55.75, 37.62, 59.93, 30.31)));
  });

  it("optimizeWaypointOrder reorders by nearest neighbor", () => {
    const items = [
      { placeId: "a", lat: 0, lng: 0 },
      { placeId: "b", lat: 0, lng: 10 },
      { placeId: "c", lat: 0, lng: 1 },
    ];
    const ordered = optimizeWaypointOrder(items);
    expect(ordered.map((x) => x.placeId)).toEqual(["a", "c", "b"]);
  });
});
