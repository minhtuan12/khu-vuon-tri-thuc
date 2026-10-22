import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Sparkles, Users, Sprout, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import {
  ADVENTURES,
  AGE_LABELS,
  getAdventure,
  type AgeBand,
  type AdventureId,
} from "@/lib/content";
import {
  activityCSV,
  addContext,
  cacheExperience,
  exportLearningData,
  restoreLearningData,
  reviewSignals,
  selectContext,
  useProgress,
} from "@/lib/progress";
import { useUser } from "@/lib/auth";
import { approveExperience, suggestExperience } from "@/lib/ai.functions";
import { fallbackExperience, validateExperience, type ExperienceProposal } from "@/lib/experiences";
import { deterministicPlan, type PlanRequest } from "@/lib/plan";
import { BigButton, Panel } from "./kit";
import { LessonPlayer } from "./LessonPlayer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

export function ContextPicker() {
  const { contexts, activeContext } = useProgress();
  return (
    <div className="learning-context">
      <Sprout aria-hidden />
      <label htmlFor="learning-context">Đang học cùng</label>
      <Select value={activeContext} onValueChange={selectContext}>
        <SelectTrigger id="learning-context" className="min-h-14 max-w-xs bg-white">
          <SelectValue>
            {activeContext === "shared"
              ? "Chơi chung"
              : contexts.find((c) => c.id === activeContext)?.name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="shared">Chơi chung</SelectItem>
          {contexts.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.kind === "class" ? "Lớp · " : "Bé · "}
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ExperienceShelf() {
  const { experiences, contexts, activeContext } = useProgress();
  const context = contexts.find((c) => c.id === activeContext);
  const list = experiences.filter((e) => !context || e.request.age === context.age);
  if (!list.length) return null;
  return (
    <section className="experience-shelf" aria-label="Hành trình đã duyệt">
      <div className="story-section__head">
        <h2>Những câu chuyện dành cho bé</h2>
        <span>Người lớn đã chuẩn bị</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {list.map((e) => (
          <Link
            key={e.id}
            to="/learn/$id"
            params={{ id: e.request.adventureId }}
            search={{
              experience: e.id,
              ...(context?.kind === "class" ? { mode: "class" as const } : {}),
            }}
            className="experience-card"
          >
            <span className="experience-card__icon">
              {e.proposal.kind === "story" ? <BookOpen aria-hidden /> : <Sparkles aria-hidden />}
            </span>
            <div>
              <small>
                {e.proposal.kind === "story" ? "Câu chuyện cùng Mầm" : "Nhiệm vụ hôm nay"}
              </small>
              <h3>{e.proposal.title}</h3>
              <p>{AGE_LABELS[e.request.age]} · 6 chặng khám phá</p>
            </div>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function download(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function LearningHub() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { user } = useUser();
  const { contexts, activeContext } = useProgress();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"learner" | "class">("learner");
  const [age, setAge] = useState<AgeBand>("4-5");
  const [adventureId, setAdventure] = useState<AdventureId>("garden");
  const [proposal, setProposal] = useState<ExperienceProposal | null>(null);
  const [source, setSource] = useState<"ai" | "fallback">("fallback");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [message, setMessage] = useState("");
  const [restore, setRestore] = useState<string | null>(null);
  const requestRef = useRef<PlanRequest | null>(null);
  const ask = useServerFn(suggestExperience),
    approve = useServerFn(approveExperience);
  const context = contexts.find((c) => c.id === activeContext);
  const req: PlanRequest = {
    adventureId,
    age: context?.age ?? age,
    duration: "standard",
    movement: true,
  };
  async function generate(type: "story" | "review", ai: boolean) {
    if (busy) return;
    setBusy(true);
    setProposal(null);
    setMessage("");
    requestRef.current = req;
    const signals = reviewSignals(adventureId);
    try {
      if (ai && user) {
        const r = await ask({
          data: { ...req, kind: type, signals: type === "review" ? signals : [] },
        });
        if (r.ok) {
          setProposal(r.proposal);
          setSource("ai");
          return;
        }
        setMessage(r.reason);
      }
      setProposal(
        fallbackExperience(req, type, type === "review" ? signals.map((s) => s.wordId) : []),
      );
      setSource("fallback");
    } catch {
      setMessage("Không kết nối được AI. Đang dùng nội dung có sẵn.");
      setProposal(
        fallbackExperience(
          req,
          type,
          signals.map((s) => s.wordId),
        ),
      );
      setSource("fallback");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    if (!proposal || !requestRef.current) return;
    setBusy(true);
    try {
      validateExperience(proposal, requestRef.current);
      const item = await approve({ data: { request: requestRef.current, proposal, source } });
      cacheExperience(item);
      setProposal(null);
      toast.success("Đã duyệt và lưu. Bé có thể chọn câu chuyện trong Phiêu lưu.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chưa lưu được");
    } finally {
      setBusy(false);
    }
  }
  const clear = () => {
    setProposal(null);
    setMessage("");
  };
  return (
    <fieldset disabled={!mounted} className="learning-hub min-w-0 space-y-5" data-ready={mounted}>
      <Panel>
        <div className="flex items-center gap-3">
          <Users aria-hidden />
          <h2 className="text-2xl font-bold">Ở lớp và tại nhà</h2>
        </div>
        <p className="my-2">Mỗi biệt danh và mỗi lớp có một khu vườn tiến bộ riêng.</p>
        <ContextPicker />
        <form
          noValidate
          className="mt-4 flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              const c = addContext({ kind, name, age });
              selectContext(c.id);
              setName("");
              clear();
              toast.success("Đã thêm hồ sơ trên thiết bị.");
            } catch {
              toast.error("Nhập biệt danh hoặc tên lớp từ 1–30 ký tự.");
            }
          }}
        >
          <Select value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
            <SelectTrigger aria-label="Loại hồ sơ" className="min-h-14 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="learner">Gia đình · Bé</SelectItem>
              <SelectItem value="class">Giáo viên · Lớp</SelectItem>
            </SelectContent>
          </Select>
          <input
            aria-label="Biệt danh hoặc tên lớp"
            maxLength={30}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bé Nắng / Lớp Lá"
            className="min-h-14 flex-1 rounded-2xl border-2 bg-white px-4"
          />
          <Select
            value={age}
            onValueChange={(v) => {
              setAge(v as AgeBand);
              clear();
            }}
          >
            <SelectTrigger aria-label="Độ tuổi" className="min-h-14 w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AGE_LABELS).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <BigButton type="submit">Thêm hồ sơ</BigButton>
        </form>
      </Panel>
      <Panel className="space-y-4">
        <span className="storybook-page__eyebrow">CÔ VÀ GIA ĐÌNH CÙNG CHUẨN BỊ</span>
        <h2 className="text-3xl font-bold">Một chuyến đi mới cùng Mầm</h2>
        <p>Chọn thế giới, xem trước rồi duyệt. Bé chỉ chơi nội dung đã được người lớn chuẩn bị.</p>
        <div className="flex flex-wrap gap-2">
          {ADVENTURES.map((a) => (
            <BigButton
              key={a.id}
              disabled={busy}
              variant={adventureId === a.id ? "leaf" : "paper"}
              onClick={() => {
                setAdventure(a.id);
                clear();
              }}
            >
              {a.title}
            </BigButton>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            disabled={busy || !user}
            className="experience-card"
            onClick={() => void generate("story", true)}
          >
            <BookOpen aria-hidden />
            <div>
              <h3>Câu chuyện cùng Mầm</h3>
              <p>Bé chọn hình, câu chuyện đổi theo</p>
            </div>
          </button>
          <button
            disabled={busy || !user}
            className="experience-card"
            onClick={() => void generate("review", true)}
          >
            <Sparkles aria-hidden />
            <div>
              <h3>Nhiệm vụ hôm nay</h3>
              <p>Ôn những từ bé cần gặp lại</p>
            </div>
          </button>
        </div>
        {!user && (
          <p>
            <Link to="/auth" className="underline">
              Đăng nhập
            </Link>{" "}
            để tạo AI và duyệt nội dung. Vẫn có thể xem thử bản có sẵn.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <BigButton variant="paper" disabled={busy} onClick={() => void generate("story", false)}>
            Câu chuyện có sẵn
          </BigButton>
          <BigButton variant="paper" disabled={busy} onClick={() => void generate("review", false)}>
            Ôn tập có sẵn
          </BigButton>
        </div>
        <p role="status" className="min-h-6">
          {busy ? "Mầm đang chuẩn bị…" : message}
        </p>
        {proposal && (
          <div className="space-y-3 rounded-3xl bg-sky/50 p-4">
            <p className="font-bold">
              {source === "ai" ? "Đề xuất AI · Chưa duyệt" : "Nội dung có sẵn · Không phải AI"}
            </p>
            <h3 className="text-2xl font-bold">{proposal.title}</h3>
            {proposal.chapters.map((chapter, i) => (
              <label key={chapter.stage} className="block">
                Chặng {i + 1}
                <Textarea
                  maxLength={240}
                  value={chapter.text}
                  onChange={(e) =>
                    setProposal({
                      ...proposal,
                      chapters: proposal.chapters.map((c, j) =>
                        j === i ? { ...c, text: e.target.value } : c,
                      ),
                    })
                  }
                />
                {chapter.choices.length > 0 && (
                  <span className="text-sm">
                    Các nhánh:{" "}
                    {chapter.choices.map((c) => `${c.wordId}: ${c.response}`).join(" · ")}
                  </span>
                )}
              </label>
            ))}
            <div className="flex flex-wrap gap-3">
              <BigButton
                variant="paper"
                onClick={() => {
                  try {
                    validateExperience(proposal, requestRef.current!);
                    setPreview(true);
                  } catch {
                    toast.error("Kiểm tra lời dẫn: không để trống, không HTML.");
                  }
                }}
              >
                <Eye aria-hidden />
                Xem trước tại đây
              </BigButton>
              <BigButton disabled={busy || !user} onClick={() => void save()}>
                Duyệt & lưu cho bé
              </BigButton>
            </div>
          </div>
        )}
      </Panel>
      <Panel>
        <h2 className="text-2xl font-bold">Giữ lại những chuyến đi</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <BigButton
            variant="paper"
            onClick={() =>
              download("khu-vuon-sao-luu.json", exportLearningData(), "application/json")
            }
          >
            <Download aria-hidden />
            Sao lưu JSON
          </BigButton>
          <BigButton
            variant="paper"
            onClick={() => download("khu-vuon-hoat-dong.csv", activityCSV(), "text/csv")}
          >
            Xuất CSV
          </BigButton>
          <label className="tactile inline-flex min-h-14 cursor-pointer items-center rounded-3xl border-2 bg-white px-5 font-bold">
            Chọn bản sao lưu
            <input
              aria-label="Chọn file sao lưu JSON"
              type="file"
              accept=".json"
              className="sr-only"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10_000_000) {
                  toast.error("File quá lớn (tối đa 10 MB).");
                  return;
                }
                setRestore(await file.text());
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </Panel>
      <Dialog
        open={restore !== null}
        onOpenChange={(v) => {
          if (!v) setRestore(null);
        }}
      >
        <DialogContent>
          <DialogTitle>Khôi phục dữ liệu?</DialogTitle>
          <DialogDescription>
            Thay dữ liệu học trên thiết bị của tài khoản hiện tại. Hãy sao lưu trước; trải nghiệm AI
            phải đã được tài khoản này duyệt.
          </DialogDescription>
          <BigButton variant="paper" onClick={() => setRestore(null)}>
            Giữ dữ liệu hiện tại
          </BigButton>
          <BigButton
            onClick={() => {
              try {
                restoreLearningData(restore!);
                setRestore(null);
                toast.success("Đã khôi phục.");
              } catch {
                toast.error("Bản sao lưu không hợp lệ hoặc chứa trải nghiệm chưa duyệt.");
              }
            }}
          >
            Khôi phục
          </BigButton>
        </DialogContent>
      </Dialog>
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[95dvh] max-w-6xl overflow-y-auto p-1">
          <DialogTitle className="px-5 pt-3">Xem trước · Không lưu tiến độ</DialogTitle>
          <DialogDescription className="px-5">
            Thử bài ngay tại đây, đóng để tiếp tục chỉnh sửa.
          </DialogDescription>
          {proposal && requestRef.current && (
            <LessonPlayer
              key={JSON.stringify(proposal)}
              adventure={getAdventure(requestRef.current.adventureId)!}
              plan={{
                ...deterministicPlan(requestRef.current),
                wordIds: proposal.wordIds,
                movementId: proposal.movementId,
                experience: proposal,
              }}
              preview
            />
          )}
        </DialogContent>
      </Dialog>
    </fieldset>
  );
}
