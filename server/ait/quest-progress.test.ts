import { describe, expect, it, vi } from "vitest";

vi.mock("../db", () => ({
  getDb: vi.fn(() => null),
}));

import { incrementRing, getQuestProgress, getWeeklyRingTotal } from "./store";

describe("weekly quest progress", () => {
  it("aggregates voice ring counts across the week via getWeeklyRingTotal", async () => {
    const uid = "quest-voice-weekly";
    for (let i = 0; i < 5; i++) {
      await incrementRing(uid, "voice");
    }
    expect(await getWeeklyRingTotal(uid, "voice")).toBe(5);
    const progress = await getQuestProgress(uid);
    expect(progress.voice_7?.progress).toBe(5);
  });

  it("counts story quest progress from weekly story ring total", async () => {
    const uid = "quest-story-weekly";
    await incrementRing(uid, "story");
    await incrementRing(uid, "story");
    expect(await getWeeklyRingTotal(uid, "story")).toBe(2);
    const progress = await getQuestProgress(uid);
    expect(progress.story_2?.progress).toBe(2);
    expect(progress.story_2?.claimed).toBe(false);
  });

  it("uses weekly login days for pulse_5 quest", async () => {
    const uid = "quest-pulse";
    const progress = await getQuestProgress(uid);
    expect(progress.pulse_5?.progress).toBeGreaterThanOrEqual(0);
    expect(progress.pulse_5?.progress).toBeLessThanOrEqual(5);
  });
});
