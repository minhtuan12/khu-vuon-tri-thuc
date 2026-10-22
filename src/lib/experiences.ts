import { z } from "zod";
import { getAdventure, STAGES } from "./content";
import {
  deterministicPlan,
  planRequestSchema,
  validateProposal,
  type LessonPlan,
  type PlanRequest,
} from "./plan";

export const experienceKindSchema = z.enum(["story", "review"]);
const line = z
  .string()
  .trim()
  .min(1)
  .max(240)
  .refine((v) => !/[<>]/.test(v), "Chỉ dùng văn bản, không HTML");
export const experienceSchema = z
  .object({
    kind: experienceKindSchema,
    title: line,
    wordIds: z.array(z.string()).min(3).max(4),
    movementId: z.string(),
    teacherTipVi: z.string().max(240),
    chapters: z
      .array(
        z
          .object({
            stage: z.enum(["intro", "listen", "scene", "move", "recall", "celebrate"]),
            text: line,
            choices: z.array(z.object({ wordId: z.string(), response: line })).max(4),
          })
          .strict(),
      )
      .length(6),
  })
  .strict();
export type StoryProposal = z.infer<typeof experienceSchema> & { kind: "story" };
export type ReviewProposal = z.infer<typeof experienceSchema> & { kind: "review" };
export type ExperienceProposal = z.infer<typeof experienceSchema>;
export interface ApprovedExperience {
  id: string;
  version: 1;
  request: PlanRequest;
  proposal: ExperienceProposal;
  source: "ai" | "fallback";
  approvedAt: string;
}
export const experienceRequestSchema = planRequestSchema.extend({
  kind: experienceKindSchema,
  signals: z
    .array(
      z
        .object({
          wordId: z.string(),
          attempts: z.number().int().min(0).max(10000),
          hints: z.number().int().min(0).max(10000),
        })
        .strict(),
    )
    .max(4)
    .default([]),
});
export function validateExperience(raw: unknown, req: PlanRequest): ExperienceProposal {
  const proposal = experienceSchema.parse(raw);
  validateProposal(proposal, req);
  const allowed = new Set(getAdventure(req.adventureId)!.words.map((w) => w.id));
  const base = deterministicPlan(req);
  if (
    proposal.wordIds.length !== base.wordIds.length ||
    new Set(proposal.wordIds).size !== proposal.wordIds.length ||
    proposal.wordIds.some((id) => !allowed.has(id))
  )
    throw new Error("Từ vựng không hợp lệ");
  proposal.chapters.forEach((chapter, i) => {
    if (chapter.stage !== STAGES[i]!.type) throw new Error("Cần đúng sáu chặng theo thứ tự");
    // Branches are bounded choices inside a chapter; every branch rejoins at the next chapter.
    const count = i === 2 ? base.options : 0;
    if (
      chapter.choices.length !== count ||
      new Set(chapter.choices.map((c) => c.wordId)).size !== count ||
      chapter.choices.some((c) => !allowed.has(c.wordId))
    )
      throw new Error("Nhánh câu chuyện không hợp lệ");
  });
  return proposal;
}
export function fallbackExperience(
  req: PlanRequest,
  kind: ExperienceProposal["kind"],
  priority: string[] = [],
): ExperienceProposal {
  const adv = getAdventure(req.adventureId)!;
  const base = deterministicPlan(req);
  const allowed = adv.words.map((w) => w.id);
  const wordIds = [
    ...new Set([...priority.filter((id) => allowed.includes(id)), ...allowed]),
  ].slice(0, base.wordIds.length);
  return validateExperience(
    {
      kind,
      title: kind === "story" ? `Cùng Mầm: ${adv.title}` : "Nhiệm vụ hôm nay cùng Mầm",
      wordIds,
      movementId: base.movementId,
      teacherTipVi: "Khen nỗ lực, cho bé nghe lại và cùng bé chọn hình.",
      chapters: STAGES.map((s, i) => ({
        stage: s.type,
        text: [
          adv.introVi,
          "Cùng Mầm lắng nghe và tìm bạn nhé!",
          "Bé muốn ghé thăm bạn nào trước?",
          "Cùng Mầm vận động nhẹ nhàng nhé!",
          "Bạn nào vừa đi trốn? Bé giúp Mầm nhé!",
          "Cảm ơn bé đã cùng Mầm khám phá khu vườn!",
        ][i],
        choices:
          i === 2
            ? adv.words.slice(0, base.options).map((w) => ({
                wordId: w.id,
                response: `Mầm và bé đã tìm thấy ${w.vi}. Cùng nghe bạn ấy nhé!`,
              }))
            : [],
      })),
    },
    req,
  );
}
export function experiencePlan(experience: ApprovedExperience): LessonPlan {
  return {
    ...validateProposal(experience.proposal, experience.request),
    source: experience.source,
    experienceId: experience.id,
    contentVersion: 1,
    experience: experience.proposal,
  };
}
export const approvedExperienceSchema = z.object({
  id: z.string().uuid(),
  version: z.literal(1),
  request: planRequestSchema,
  proposal: experienceSchema,
  source: z.enum(["ai", "fallback"]),
  approvedAt: z.string().datetime(),
});
