import { describe, expect, it } from "vitest";
import { ADVENTURES, type AgeBand } from "@/lib/content";
import { fallbackExperience, validateExperience } from "@/lib/experiences";

describe("reviewed experiences", () => {
  for (const a of ADVENTURES)
    for (const age of ["3-4", "4-5", "5-6"] as AgeBand[])
      it(`${a.id}/${age} has six terminating chapters`, () => {
        const req = { adventureId: a.id, age, duration: "standard" as const, movement: true };
        const p = fallbackExperience(req, "story");
        expect(validateExperience(p, req).chapters).toHaveLength(6);
        expect(p.chapters[2]!.choices).toHaveLength(age === "3-4" ? 2 : age === "4-5" ? 3 : 4);
      });
  const req = {
    adventureId: "garden" as const,
    age: "4-5" as const,
    duration: "standard" as const,
    movement: true,
  };
  it("rejects foreign words, duplicate choices, HTML and broken stages", () => {
    const p = fallbackExperience(req, "story");
    expect(() =>
      validateExperience({ ...p, wordIds: ["sun", "rain", "rabbit", "pizza"] }, req),
    ).toThrow();
    for (const mutate of [
      (p: ReturnType<typeof fallbackExperience>) => {
        p.chapters[2]!.choices[1] = p.chapters[2]!.choices[0]!;
      },
      (p: ReturnType<typeof fallbackExperience>) => {
        p.chapters[0]!.text = "<script>bad</script>";
      },
      (p: ReturnType<typeof fallbackExperience>) => {
        p.chapters.reverse();
      },
    ]) {
      const copy = structuredClone(p);
      mutate(copy);
      expect(() => validateExperience(copy, req)).toThrow();
    }
  });
  it("review prioritizes curated words only", () => {
    expect(fallbackExperience(req, "review", ["pizza", "rabbit"]).wordIds[0]).toBe("rabbit");
  });
});
