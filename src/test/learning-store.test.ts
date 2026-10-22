import { beforeEach, describe, expect, it, vi } from "vitest";
const rpc = vi.fn(async () => ({
  data: { contexts: [], experiences: [], progress: {}, events: [] },
  error: null,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc, from: () => ({ select: async () => ({ data: [], error: null }) }) },
}));
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  rpc.mockClear();
});
describe("local-first learning store", () => {
  it("retains the selected learner after reload", async () => {
    const s = await import("@/lib/progress");
    const c = s.addContext({ kind: "learner", name: "Mây", age: "4-5" });
    s.selectContext(c.id);
    s.recordProgress("garden", { stage: 2 });
    vi.resetModules();
    const reloaded = await import("@/lib/progress");
    expect(reloaded.getProgress("garden")?.stage).toBe(2);
  });
  it("separates learners, classrooms and shared play without network", async () => {
    const s = await import("@/lib/progress");
    const a = s.addContext({ kind: "learner", name: "Nắng", age: "3-4" }),
      b = s.addContext({ kind: "class", name: "Lá", age: "5-6" });
    s.selectContext(a.id);
    s.recordProgress("garden", { stage: 2, wordsSeen: ["sun"] });
    s.selectContext(b.id);
    expect(s.getProgress("garden")).toBeUndefined();
    s.recordProgress("garden", { stage: 4 });
    s.selectContext(a.id);
    expect(s.getProgress("garden")?.stage).toBe(2);
    s.selectContext("shared");
    expect(s.getProgress("garden")).toBeUndefined();
    expect(rpc).not.toHaveBeenCalled();
  });
  it("migrates legacy guest progress to shared only", async () => {
    localStorage.setItem(
      "kvtt.progress.v1",
      JSON.stringify({
        items: { garden: { stage: 3, completed: false, wordsSeen: ["sun"], updatedAt: 10 } },
      }),
    );
    const s = await import("@/lib/progress");
    expect(s.getProgress("garden")?.stage).toBe(3);
    const c = s.addContext({ kind: "learner", name: "Mây", age: "4-5" });
    s.selectContext(c.id);
    expect(s.getProgress("garden")).toBeUndefined();
  });
  it("does not transfer guest/account data across sign-ins", async () => {
    const s = await import("@/lib/progress");
    s.recordProgress("garden", { stage: 2 });
    await s.attachUser("user-a");
    expect(s.getProgress("garden")).toBeUndefined();
    s.recordProgress("garden", { stage: 4 });
    await s.syncNow();
    await s.attachUser("user-b");
    expect(s.getProgress("garden")).toBeUndefined();
    await s.attachUser(null);
    expect(s.getProgress("garden")?.stage).toBe(2);
  });
  it("rejects malformed backups without changing progress", async () => {
    const s = await import("@/lib/progress");
    s.recordProgress("garden", { stage: 2 });
    expect(() => s.restoreLearningData('{"app":"kvtt","version":2,"data":{}}')).toThrow();
    expect(s.getProgress("garden")?.stage).toBe(2);
  });
  it("records separate experience progress and idempotent event IDs", async () => {
    const s = await import("@/lib/progress");
    s.recordProgress("garden", { stage: 1 });
    s.recordProgress("garden", { stage: 4 }, "story-id");
    expect(s.getProgress("garden")?.stage).toBe(1);
    expect(s.getProgress("garden", "story-id")?.stage).toBe(4);
    s.recordActivity({
      adventureId: "garden",
      experienceId: "standard",
      wordId: "sun",
      kind: "hint",
    });
    expect(s.reviewSignals("garden")[0]?.wordId).toBe("sun");
  });
});
