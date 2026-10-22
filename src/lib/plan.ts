import { z } from "zod";
import { getAdventure, optionsForAge, type AdventureId, type AgeBand } from "./content";

export type Duration = "short" | "standard";

export interface LessonPlan {
  experienceId?: string;
  contentVersion?: number;
  experience?: import("./experiences").ExperienceProposal;
  adventureId: AdventureId;
  age: AgeBand;
  wordIds: string[]; // order used in "listen" stage; always from curated list
  options: 2 | 3 | 4;
  movement: boolean;
  movementId: string;
  moveSeconds: number;
  source: "default" | "ai" | "fallback";
  teacherTipVi: string | null;
}

export interface PlanRequest {
  adventureId: AdventureId;
  age: AgeBand;
  duration: Duration;
  movement: boolean;
}

export const planRequestSchema = z.object({
  adventureId: z.enum(["garden", "colors", "train"]),
  age: z.enum(["3-4", "4-5", "5-6"]),
  duration: z.enum(["short", "standard"]),
  movement: z.boolean(),
});

/** Shape the AI must return (validated again on the server before use). */
export const aiProposalSchema = z.object({
  wordIds: z.array(z.string()),
  movementId: z.string(),
  teacherTipVi: z.string(),
});

/** Deterministic, curated plan. Used as default and as the labelled "Gợi ý có sẵn" fallback. */
export function deterministicPlan(
  req: PlanRequest,
  source: LessonPlan["source"] = "fallback",
): LessonPlan {
  const adv = getAdventure(req.adventureId)!;
  const count = req.duration === "short" ? 3 : 4;
  return {
    adventureId: adv.id,
    age: req.age,
    wordIds: adv.words.slice(0, count).map((w) => w.id),
    options: optionsForAge(req.age) as 2 | 3 | 4,
    movement: req.movement,
    movementId: adv.movements[0]!.id,
    moveSeconds: req.duration === "short" ? 10 : 20,
    source,
    teacherTipVi:
      source === "fallback"
        ? "Gợi ý có sẵn: đọc chậm, chỉ vào hình khi nói từ, khen nỗ lực của bé thay vì đúng/sai."
        : null,
  };
}

/**
 * Validate an AI proposal against curated content and approved stage rules.
 * Unknown words/movements are rejected, never invented. Throws on invalid input.
 */
export function validateProposal(raw: unknown, req: PlanRequest): LessonPlan {
  const p = aiProposalSchema.parse(raw);
  const adv = getAdventure(req.adventureId)!;
  const allowed = new Set(adv.words.map((w) => w.id));
  const count = req.duration === "short" ? 3 : 4;
  const words = Array.from(new Set(p.wordIds.map((w) => w.trim().toLowerCase()))).filter((w) =>
    allowed.has(w),
  );
  if (words.length < count) throw new Error("AI proposal used words outside the curated list");
  if (!adv.movements.some((m) => m.id === p.movementId))
    throw new Error("AI proposal used an unapproved movement");
  const tip = p.teacherTipVi.replace(/\s+/g, " ").trim().slice(0, 240);
  return {
    ...deterministicPlan(req, "ai"),
    wordIds: words.slice(0, count),
    movementId: p.movementId,
    teacherTipVi: tip || null,
  };
}

const CLASS_KEY = "kvtt.classPlan.v1";

export function saveClassPlan(plan: LessonPlan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLASS_KEY, JSON.stringify(plan));
}

export function loadClassPlan(adventureId: AdventureId): LessonPlan | null {
  if (typeof window === "undefined") return null;
  try {
    const p = JSON.parse(localStorage.getItem(CLASS_KEY) || "null") as LessonPlan | null;
    return p && p.adventureId === adventureId ? p : null;
  } catch {
    return null;
  }
}
