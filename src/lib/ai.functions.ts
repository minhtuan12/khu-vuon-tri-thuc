import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { planRequestSchema, validateProposal, type PlanRequest } from "./plan";
import { getAdventure } from "./content";
import { z } from "zod";
import {
  experienceRequestSchema,
  experienceSchema,
  validateExperience,
  type ApprovedExperience,
} from "./experiences";
import type { Json } from "@/integrations/supabase/types";

/** Teacher-only AI suggestion. Picks only from curated words/movements; validated before returning. */
export const suggestPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PlanRequest) => planRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: reserved, error: quotaError } = await context.supabase.rpc("reserve_ai_request");
    if (quotaError || !reserved)
      return { ok: false as const, reason: "Chưa thể tạo gợi ý hoặc đã đạt giới hạn 20 lượt/giờ." };

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, reason: "AI chưa được cấu hình." };
    const adv = getAdventure(data.adventureId)!;
    const count2 = data.duration === "short" ? 3 : 4;
    const prompt = `Bạn hỗ trợ giáo viên mầm non Việt Nam. Bài: "${adv.title}". Tuổi ${data.age}. Thời lượng ${data.duration}. Vận động: ${data.movement ? "có" : "không, ngồi tại chỗ"}.
Chọn đúng ${count2} từ, CHỈ từ danh sách: ${adv.words.map((w) => w.id).join(", ")} (sắp thứ tự dễ trước).
Chọn 1 movementId CHỈ từ: ${adv.movements.map((m) => `${m.id} (${m.vi})`).join("; ")}.
teacherTipVi: 1-2 câu tiếng Việt ngắn gợi ý cách dẫn lớp, phù hợp độ tuổi.`;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        signal: AbortSignal.timeout(30000),
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          Authorization: `Bearer ${key}`,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          store: false,
          stream: true,
          reasoning: { effort: "low" },
          input: [{ role: "user", content: prompt }],
          text: {
            format: {
              type: "json_schema",
              name: "plan",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                required: ["wordIds", "movementId", "teacherTipVi"],
                properties: {
                  wordIds: { type: "array", items: { type: "string" } },
                  movementId: { type: "string" },
                  teacherTipVi: { type: "string" },
                },
              },
            },
          },
        }),
      });
      if (!res.ok || !res.body)
        return { ok: false as const, reason: `AI không phản hồi (mã ${res.status}).` };
      const raw = await res.text();
      let out = "";
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data:")) continue;
        try {
          const ev = JSON.parse(line.slice(5));
          if (ev.type === "response.output_text.delta") out += ev.delta;
        } catch {
          /* skip */
        }
      }
      const plan = validateProposal(JSON.parse(out), data);
      return { ok: true as const, plan };
    } catch (e) {
      return {
        ok: false as const,
        reason: "Đề xuất AI không hợp lệ: " + (e instanceof Error ? e.message : "lỗi"),
      };
    }
  });

export const suggestExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => experienceRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    if (process.env[data.kind === "story" ? "FEATURE_STORY_AI" : "FEATURE_REVIEW_AI"] === "false")
      return { ok: false as const, reason: "Tính năng AI này đang tắt." };
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { ok: false as const, reason: "AI chưa được cấu hình." };
    const { data: reserved, error } = await context.supabase.rpc("reserve_ai_request");
    if (error || !reserved)
      return { ok: false as const, reason: "Chưa thể tạo gợi ý hoặc đã đạt giới hạn 20 lượt/giờ." };
    const adv = getAdventure(data.adventureId)!;
    const signals = data.signals.filter((s) => adv.words.some((w) => w.id === s.wordId));
    const prompt = `Tạo ${data.kind === "story" ? "câu chuyện tương tác" : "nhiệm vụ ôn tập"} cho trẻ ${data.age}, nhân vật Mầm. Chỉ dùng từ ${JSON.stringify(adv.words)} và động tác ${JSON.stringify(adv.movements)}.
Trả JSON: {kind,title,wordIds,movementId,teacherTipVi,chapters:[{stage,text,choices:[{wordId,response}]}]}.
kind=${data.kind}. wordIds đúng ${data.duration === "short" ? 3 : 4} từ khác nhau. chapters đúng 6 mục theo thứ tự intro,listen,scene,move,recall,celebrate. Chỉ scene có choices, đúng ${data.age === "3-4" ? 2 : data.age === "4-5" ? 3 : 4} lựa chọn từ khác nhau. Các lựa chọn đều hội tụ sang chặng move. text/response/title: tiếng Việt thuần văn bản tối đa 240 ký tự, không HTML, không yêu cầu thông tin cá nhân. Gợi ý nhẹ nhàng, không chấm thành thạo. Thống kê ôn tập ẩn danh: ${JSON.stringify(signals)}.`;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          store: false,
          stream: false,
          input: [{ role: "user", content: prompt }],
          text: { format: { type: "json_object" } },
        }),
      });
      if (!res.ok) throw new Error("AI không phản hồi");
      const body = await res.json();
      const output =
        body.output_text ??
        body.output
          ?.flatMap((o: { content?: { text?: string }[] }) => o.content ?? [])
          .map((c: { text?: string }) => c.text ?? "")
          .join("");
      const proposal = validateExperience(JSON.parse(output), data);
      if (proposal.kind !== data.kind) throw new Error("Sai loại trải nghiệm");
      return { ok: true as const, proposal };
    } catch {
      return {
        ok: false as const,
        reason: "AI chưa tạo được nội dung hợp lệ. Có thể dùng bản có sẵn.",
      };
    }
  });

export const approveExperience = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        request: planRequestSchema,
        proposal: experienceSchema,
        source: z.enum(["ai", "fallback"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const proposal = validateExperience(data.proposal, data.request);
    const item: ApprovedExperience = {
      id: crypto.randomUUID(),
      version: 1,
      request: data.request,
      proposal,
      source: data.source,
      approvedAt: new Date().toISOString(),
    };
    const { error } = await context.supabase.rpc("approve_learning_experience", {
      item: JSON.parse(JSON.stringify(item)) as Json,
    });
    if (error)
      throw new Error("Chưa lưu được bản duyệt. Kiểm tra kết nối và migration cơ sở dữ liệu.");
    return item;
  });
