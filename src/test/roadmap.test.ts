import { beforeEach, expect, it, vi } from "vitest";
import { ADVENTURES, isRoadmapExperience, LEARNING_WORLDS, roadmapKey } from "@/lib/content";
vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: vi.fn() } }));
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});
it("has twelve curated lessons across three worlds", () => {
  expect(LEARNING_WORLDS).toHaveLength(3);
  expect(ADVENTURES.flatMap((a) => a.words)).toHaveLength(12);
  for (const a of ADVENTURES)
    for (const w of a.words) expect(isRoadmapExperience(a.id, roadmapKey(w.id))).toBe(true);
  expect(isRoadmapExperience("train", "path-v1-sun")).toBe(false);
  expect(isRoadmapExperience("garden", "path-v1-unknown")).toBe(false);
});
it("separates lessons, standard progress and profiles; restores roadmap backup", async () => {
  const store = await import("@/lib/progress");
  const a = store.addContext({ name: "A", kind: "learner", age: "3-4" });
  const b = store.addContext({ name: "B", kind: "learner", age: "5-6" });
  store.selectContext(a.id);
  store.recordProgress("garden", { stage: 3, wordsSeen: ["sun"] }, roadmapKey("sun"));
  expect(store.getProgress("garden")).toBeUndefined();
  expect(store.getProgress("garden", roadmapKey("rain"))).toBeUndefined();
  store.selectContext(b.id);
  expect(store.getProgress("garden", roadmapKey("sun"))).toBeUndefined();
  const backup = store.exportLearningData();
  store.restoreLearningData(backup);
  store.selectContext(a.id);
  expect(store.getProgress("garden", roadmapKey("sun"))?.stage).toBe(3);
});
