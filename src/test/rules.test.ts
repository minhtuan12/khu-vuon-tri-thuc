import { describe, expect, it } from "vitest";
import { optionsForAge } from "@/lib/content";
import { deterministicPlan, validateProposal } from "@/lib/plan";
import { mergeProgress } from "@/lib/progress";

const req = { adventureId: "garden" as const, age: "4-5" as const, duration: "standard" as const, movement: true };

describe("lesson rules", () => {
  it("choices by age are 2/3/4", () => {
    expect([optionsForAge("3-4"), optionsForAge("4-5"), optionsForAge("5-6")]).toEqual([2, 3, 4]);
  });
  it("fallback plan is labelled as fallback, not AI", () => {
    expect(deterministicPlan(req).source).toBe("fallback");
  });
  it("short duration uses 3 words", () => {
    expect(deterministicPlan({ ...req, duration: "short" }).wordIds).toHaveLength(3);
  });
  it("rejects AI words outside curated list", () => {
    expect(() => validateProposal({ wordIds: ["sun", "rain", "rabbit", "pizza"], movementId: "hop-rabbit", teacherTipVi: "x" }, req)).toThrow();
  });
  it("rejects unapproved movements", () => {
    expect(() => validateProposal({ wordIds: ["sun", "rain", "rabbit", "apple"], movementId: "jump-off-table", teacherTipVi: "" }, req)).toThrow();
  });
  it("accepts a valid AI proposal and marks source ai", () => {
    const p = validateProposal({ wordIds: ["apple", "sun", "rain", "rabbit"], movementId: "hop-rabbit", teacherTipVi: "Đọc chậm." }, req);
    expect(p.source).toBe("ai");
    expect(p.wordIds[0]).toBe("apple");
  });
  it("merge keeps completion and union of words", () => {
    const m = mergeProgress(
      { stage: 5, completed: true, wordsSeen: ["sun"], updatedAt: 1 },
      { stage: 2, completed: false, wordsSeen: ["rain"], updatedAt: 2 },
    )!;
    expect(m.completed).toBe(true);
    expect(m.stage).toBe(2);
    expect(m.wordsSeen.sort()).toEqual(["rain", "sun"]);
  });
});
