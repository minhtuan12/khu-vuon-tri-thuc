import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { TopBar } from "@/components/TopBar";
import { BigButton, Panel } from "@/components/kit";
import { ADVENTURES, AGE_LABELS, getAdventure, type AdventureId, type AgeBand } from "@/lib/content";
import { deterministicPlan, saveClassPlan, type Duration, type LessonPlan } from "@/lib/plan";
import { suggestPlan } from "@/lib/ai.functions";
import { useUser } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Giáo viên — Khu Vườn Tri Thức" }, { name: "description", content: "Chuẩn bị bài, gợi ý cùng AI, dẫn lớp và ghi quan sát." }, { property: "og:title", content: "Khu vực giáo viên" }, { property: "og:description", content: "Chuẩn bị bài và dẫn lớp." }] }),
  component: Teacher,
});

type Level = "lam_quen" | "lam_theo" | "noi_duoc";
const LEVELS: [Level, string][] = [["lam_quen", "Làm quen"], ["lam_theo", "Làm theo"], ["noi_duoc", "Nói được"]];

function Teacher() {
  const navigate = useNavigate();
  const { user } = useUser();
  const ask = useServerFn(suggestPlan);
  const [adventureId, setAdv] = useState<AdventureId>("garden");
  const [age, setAge] = useState<AgeBand>("4-5");
  const [duration, setDuration] = useState<Duration>("standard");
  const [movement, setMovement] = useState(true);
  const [proposal, setProposal] = useState<LessonPlan | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const req = { adventureId, age, duration, movement };
  const adv = getAdventure(adventureId)!;

  async function suggest() {
    setBusy(true);
    try {
      const r = await ask({ data: req });
      if (r.ok) { setProposal(r.plan); setNote(""); }
      else { setProposal(deterministicPlan(req)); setNote(r.reason); }
    } catch {
      setProposal(deterministicPlan(req));
      setNote("Không kết nối được AI.");
    }
    setBusy(false);
  }

  function start(plan: LessonPlan, full: boolean) {
    saveClassPlan(plan);
    if (full) void document.documentElement.requestFullscreen?.().catch(() => {});
    navigate({ to: "/learn/$id", params: { id: plan.adventureId }, search: { mode: "class" } });
  }

  const active = proposal ?? deterministicPlan(req, "default");
  return (
    <div className="min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-5xl space-y-5 px-4 pb-12">
        <h1 className="text-4xl font-extrabold">Khu vực giáo viên</h1>
        <Panel className="space-y-4">
          <Choice label="Chuyến phiêu lưu" value={adventureId} set={(v) => { setAdv(v); setProposal(null); }} opts={ADVENTURES.map((a) => [a.id, a.title])} />
          <Choice label="Độ tuổi" value={age} set={(v) => { setAge(v); setProposal(null); }} opts={(Object.keys(AGE_LABELS) as AgeBand[]).map((a) => [a, AGE_LABELS[a]])} />
          <Choice label="Thời lượng" value={duration} set={(v) => { setDuration(v); setProposal(null); }} opts={[["short", "Ngắn (3 từ)"], ["standard", "Chuẩn (4 từ)"]]} />
          <Choice label="Vận động" value={movement ? "on" : "off"} set={(v) => { setMovement(v === "on"); setProposal(null); }} opts={[["on", "Có vận động"], ["off", "Ngồi tại chỗ"]]} />
          <div className="flex flex-wrap gap-2">
            {user ? <BigButton variant="sun" size="lg" onClick={suggest} disabled={busy}>{busy ? "Đang hỏi AI…" : "Gợi ý cùng AI"}</BigButton>
              : <Link to="/auth" className="tactile inline-flex items-center rounded-3xl bg-sun px-6 py-3 font-bold">Đăng nhập để dùng Gợi ý cùng AI</Link>}
          </div>
        </Panel>

        <Panel className="space-y-3">
          <h2 className="text-2xl font-bold">
            {active.source === "ai" ? "Đề xuất của AI (cần duyệt)" : active.source === "fallback" ? "Gợi ý có sẵn (không phải AI)" : "Bài chuẩn"}
          </h2>
          {note && <p className="rounded-2xl bg-coral p-3 font-bold">{note} Đang dùng “Gợi ý có sẵn”.</p>}
          <ul className="list-disc pl-6">
            <li>Từ: {active.wordIds.join(", ")}</li>
            <li>Số lựa chọn mỗi câu: {active.options}</li>
            <li>Vận động: {adv.movements.find((m) => m.id === active.movementId)?.[active.movement ? "vi" : "quietVi"]} ({active.moveSeconds} giây)</li>
            {active.teacherTipVi && <li>Gợi ý dẫn lớp: {active.teacherTipVi}</li>}
          </ul>
          <div className="flex flex-wrap gap-2">
            <BigButton variant="paper" onClick={() => start(active, false)}>Duyệt & xem trước</BigButton>
            <BigButton size="lg" onClick={() => start(active, true)}>Duyệt & bắt đầu lớp (toàn màn hình)</BigButton>
          </div>
        </Panel>

        {user ? <Observations adventureId={adventureId} /> : <Panel><p>Đăng nhập để ghi quan sát cho từng bé (chỉ bạn xem được).</p></Panel>}
      </main>
    </div>
  );
}

function Choice<T extends string>({ label, value, set, opts }: { label: string; value: T; set: (v: T) => void; opts: [T, string][] }) {
  return (
    <fieldset>
      <legend className="mb-1 font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {opts.map(([v, l]) => <BigButton key={v} variant={value === v ? "leaf" : "paper"} aria-pressed={value === v} onClick={() => set(v)}>{l}</BigButton>)}
      </div>
    </fieldset>
  );
}

interface Learner { id: string; pseudonym: string; age_band: string }

function Observations({ adventureId }: { adventureId: AdventureId }) {
  const adv = getAdventure(adventureId)!;
  const [learners, setLearners] = useState<Learner[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [obs, setObs] = useState<Record<string, Level>>({});
  const [name, setName] = useState("");
  const [age, setAge] = useState<AgeBand>("4-5");

  async function loadLearners() {
    const { data, error } = await supabase.from("learner_profiles").select("id, pseudonym, age_band").order("created_at");
    if (error) return void toast.error("Không tải được danh sách bé.");
    setLearners(data);
    if (!sel && data[0]) setSel(data[0].id);
  }
  useEffect(() => { void loadLearners(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!sel) return;
    supabase.from("observations").select("word, level").eq("learner_id", sel).eq("adventure_id", adventureId).then(({ data }) => {
      setObs(Object.fromEntries((data ?? []).map((o) => [o.word, o.level as Level])));
    });
  }, [sel, adventureId]);

  async function addLearner(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("learner_profiles").insert({ pseudonym: name.trim().slice(0, 30), age_band: age, avatar: "sun" });
    if (error) return void toast.error("Chưa lưu được.");
    setName("");
    void loadLearners();
  }

  async function mark(word: string, level: Level | null) {
    if (!sel) return;
    const prev = obs;
    const nextObs = { ...obs };
    if (level) nextObs[word] = level; else delete nextObs[word];
    setObs(nextObs);
    const { error } = level
      ? await supabase.from("observations").upsert({ learner_id: sel, adventure_id: adventureId, word, level, updated_at: new Date().toISOString() }, { onConflict: "learner_id,adventure_id,word" })
      : await supabase.from("observations").delete().eq("learner_id", sel).eq("adventure_id", adventureId).eq("word", word);
    if (error) { setObs(prev); toast.error("Chưa lưu được quan sát. Thử lại."); }
  }

  return (
    <Panel className="space-y-4">
      <h2 className="text-2xl font-bold">Quan sát của giáo viên</h2>
      <p className="text-sm">Chỉ dùng biệt danh. Từ chưa đánh dấu là “Chưa quan sát”.</p>
      <form onSubmit={addLearner} className="flex flex-wrap gap-2">
        <input aria-label="Biệt danh của bé" placeholder="Biệt danh (vd: Bé Nắng)" value={name} onChange={(e) => setName(e.target.value)} className="min-h-14 flex-1 rounded-2xl border-2 border-input bg-card px-4" />
        <select aria-label="Nhóm tuổi" value={age} onChange={(e) => setAge(e.target.value as AgeBand)} className="min-h-14 rounded-2xl border-2 border-input bg-card px-3">
          {(Object.keys(AGE_LABELS) as AgeBand[]).map((a) => <option key={a} value={a}>{AGE_LABELS[a]}</option>)}
        </select>
        <BigButton type="submit">Thêm bé</BigButton>
      </form>
      <div className="flex flex-wrap gap-2">
        {learners.map((l) => <BigButton key={l.id} variant={sel === l.id ? "sky" : "paper"} onClick={() => setSel(l.id)}>{l.pseudonym}</BigButton>)}
      </div>
      {sel && adv.words.map((w) => (
        <div key={w.id} className="flex flex-wrap items-center gap-2">
          <span className="w-28 font-bold">{w.en}</span>
          {LEVELS.map(([lv, label]) => <BigButton key={lv} variant={obs[w.id] === lv ? "leaf" : "paper"} aria-pressed={obs[w.id] === lv} onClick={() => mark(w.id, lv)}>{label}</BigButton>)}
          <BigButton variant={obs[w.id] ? "ghost" : "sun"} aria-pressed={!obs[w.id]} onClick={() => mark(w.id, null)}>Chưa quan sát</BigButton>
        </div>
      ))}
    </Panel>
  );
}
