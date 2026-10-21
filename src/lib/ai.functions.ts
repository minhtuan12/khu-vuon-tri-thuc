import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { planRequestSchema, validateProposal, type PlanRequest } from "./plan";
import { getAdventure } from "./content";

/** Teacher-only AI suggestion. Picks only from curated words/movements; validated before returning. */
export const suggestPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PlanRequest) => planRequestSchema.parse(input))
  .handler(async ({ data, context }) => {
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await context.supabase.from("ai_requests").select("id", { count: "exact", head: true }).gte("created_at", since);
    if ((count ?? 0) >= 20) return { ok: false as const, reason: "Đã đạt giới hạn 20 gợi ý AI mỗi giờ." };
    await context.supabase.from("ai_requests").insert({ owner_id: context.userId });

    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false as const, reason: "AI chưa được cấu hình." };
    const adv = getAdventure(data.adventureId)!;
    const count2 = data.duration === "short" ? 3 : 4;
    const prompt = `Bạn hỗ trợ giáo viên mầm non Việt Nam. Bài: "${adv.title}". Tuổi ${data.age}. Thời lượng ${data.duration}. Vận động: ${data.movement ? "có" : "không, ngồi tại chỗ"}.
Chọn đúng ${count2} từ, CHỈ từ danh sách: ${adv.words.map((w) => w.id).join(", ")} (sắp thứ tự dễ trước).
Chọn 1 movementId CHỈ từ: ${adv.movements.map((m) => `${m.id} (${m.vi})`).join("; ")}.
teacherTipVi: 1-2 câu tiếng Việt ngắn gợi ý cách dẫn lớp, phù hợp độ tuổi.`;
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": key, Authorization: `Bearer ${key}`, "X-Lovable-AIG-SDK": "fetch" },
        body: JSON.stringify({
          model: "openai/gpt-6-astra",
          store: false,
          stream: true,
          reasoning: { effort: "low" },
          input: [{ role: "user", content: prompt }],
          text: {
            format: {
              type: "json_schema", name: "plan", strict: true,
              schema: { type: "object", additionalProperties: false, required: ["wordIds", "movementId", "teacherTipVi"], properties: { wordIds: { type: "array", items: { type: "string" } }, movementId: { type: "string" }, teacherTipVi: { type: "string" } } },
            },
          },
        }),
      });
      if (!res.ok || !res.body) return { ok: false as const, reason: `AI không phản hồi (mã ${res.status}).` };
      const raw = await res.text();
      let out = "";
      for (const line of raw.split("\n")) {
        if (!line.startsWith("data:")) continue;
        try { const ev = JSON.parse(line.slice(5)); if (ev.type === "response.output_text.delta") out += ev.delta; } catch { /* skip */ }
      }
      const plan = validateProposal(JSON.parse(out), data);
      return { ok: true as const, plan };
    } catch (e) {
      return { ok: false as const, reason: "Đề xuất AI không hợp lệ: " + (e instanceof Error ? e.message : "lỗi") };
    }
  });
