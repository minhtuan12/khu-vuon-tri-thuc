import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Pause, Play, RotateCcw, SkipForward, Volume2, X, Mail, Home } from "lucide-react";
import { STAGES, type Adventure } from "@/lib/content";
import type { LessonPlan } from "@/lib/plan";
import { cancelSpeech, speak, useSpeaking, useVoiceStatus, type Segment } from "@/lib/speech";
import { getProgress, recordProgress } from "@/lib/progress";
import { GardenScene } from "./GardenScene";
import { Mascot, type Mood } from "./Mascot";
import { WordArt } from "./WordArt";
import { BigButton } from "./kit";
import { cn } from "@/lib/utils";

const PRAISE = ["Giỏi quá!", "Tuyệt vời!", "Bé làm được rồi!", "Hay lắm!"];

function pickOptions(all: string[], target: string, n: number, seed: number) {
  const others = all.filter((w) => w !== target);
  const rotated = others.map((_, i) => others[(i + seed) % others.length]!);
  const opts: string[] = [target, ...rotated.slice(0, n - 1)].filter((x): x is string => !!x);
  // deterministic shuffle so target isn't always first
  const shift = (seed * 7 + 3) % opts.length;
  return opts.map((_, i) => opts[(i + shift) % opts.length]!);
}

export function LessonPlayer({ adventure, plan, classroom = false }: { adventure: Adventure; plan: LessonPlan; classroom?: boolean }) {
  const navigate = useNavigate();
  const voice = useVoiceStatus();
  const speaking = useSpeaking();
  const words = useMemo(() => plan.wordIds.map((id) => adventure.words.find((w) => w.id === id)!).filter(Boolean), [plan, adventure]);
  const allIds = adventure.words.map((w) => w.id);
  const movement = (adventure.movements.find((m) => m.id === plan.movementId) ?? adventure.movements[0])!;

  const [stage, setStageState] = useState(0);
  const [started, setStarted] = useState(false);
  const [q, setQ] = useState(0);
  const [tries, setTries] = useState(0);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [solved, setSolved] = useState<string[]>([]);
  const [justRight, setJustRight] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(plan.moveSeconds);
  const [recallPhase, setRecallPhase] = useState<"look" | "guess" | "done">("look");
  const [caption, setCaption] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resume from stored progress (client only)
  useEffect(() => {
    const p = getProgress(adventure.id);
    if (p && p.stage > 0 && p.stage < STAGES.length) {
      setStageState(p.stage);
      if (p.stage >= 2) setSolved(words.map((w) => w.id));
    }
    return () => {
      cancelSpeech();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adventure.id]);

  const say = useCallback((segs: Segment[]) => {
    setCaption(segs.map((s) => s.text).join(" "));
    void speak(segs);
  }, []);

  const goStage = useCallback(
    (next: number) => {
      if (timer.current) clearTimeout(timer.current);
      cancelSpeech();
      setStageState(next);
      setStarted(true);
      setCaption("");
      setTries(0);
      setWrongId(null);
      setJustRight(false);
      setRecallPhase("look");
      setSeconds(plan.moveSeconds);
      recordProgress(adventure.id, { stage: next, completed: STAGES[next]?.type === "celebrate" });
    },
    [adventure.id, plan.moveSeconds],
  );

  const type = STAGES[stage]!.type;
  const target = type === "listen" ? words[q] : type === "recall" ? words[words.length > 1 ? 1 : 0] : undefined;
  const options = useMemo(
    () => (target ? pickOptions(allIds, target.id, plan.options, type === "recall" ? q + 5 : q) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [target?.id, plan.options, type, q],
  );

  /** The current spoken prompt — always replayable. */
  const prompt = useCallback((): Segment[] => {
    switch (type) {
      case "intro":
        return [{ text: adventure.introVi, lang: "vi" }];
      case "listen":
        return target ? [{ text: "Bé hãy nghe và chọn nhé:", lang: "vi" }, { text: target.en, lang: "en" }] : [];
      case "scene":
        return [{ text: adventure.sceneVi, lang: "vi" }];
      case "move":
        return [{ text: plan.movement ? movement.vi : movement.quietVi, lang: "vi" }, ...(plan.movement ? [{ text: movement.en, lang: "en" as const }] : [])];
      case "recall":
        return recallPhase === "look"
          ? [{ text: "Bé nhìn thật kỹ các bạn nhé. Sắp có một bạn đi trốn đấy!", lang: "vi" }]
          : [{ text: "Bạn nào vừa đi trốn? Bé chọn giúp Mầm nhé!", lang: "vi" }];
      case "celebrate":
        return [{ text: "Hoan hô! Bé đã hoàn thành chuyến phiêu lưu. Hôm nay bé đã gặp:", lang: "vi" }, { text: words.map((w) => w.en).join(", "), lang: "en" }];
    }
  }, [type, target, adventure, movement, plan.movement, recallPhase, words]);

  // Auto-speak prompt when stage/question changes (only after the first user click).
  useEffect(() => {
    if (!started || paused) return;
    say(prompt());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, stage, q, recallPhase]);

  // Movement countdown
  useEffect(() => {
    if (type !== "move" || !started || paused || seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [type, started, paused, seconds]);

  const advanceListen = useCallback(() => {
    if (q + 1 < words.length) {
      setQ(q + 1);
      setCaption("");
      setTries(0);
      setWrongId(null);
      setJustRight(false);
    } else {
      goStage(stage + 1);
    }
  }, [q, words.length, goStage, stage]);

  function choose(id: string) {
    if (paused || justRight || !target) return;
    if (id === target.id) {
      setJustRight(true);
      setWrongId(null);
      const praise = PRAISE[(q + tries) % PRAISE.length]!;
      if (type === "listen") {
        setSolved((s) => Array.from(new Set([...s, id])));
        recordProgress(adventure.id, { wordsSeen: [id] });
        say([{ text: praise, lang: "vi" }, { text: target.sentence, lang: "en" }]);
        timer.current = setTimeout(advanceListen, 2600);
      } else {
        setRecallPhase("done");
        say([{ text: `${praise} Bạn ấy là`, lang: "vi" }, { text: target.en, lang: "en" }]);
      }
    } else {
      setTries((t) => t + 1);
      setWrongId(id);
      const wrong = adventure.words.find((w) => w.id === id)!;
      if (tries + 1 >= 2) {
        say([{ text: `Mầm giúp bé nhé. Đây là ${target.vi}:`, lang: "vi" }, { text: target.en, lang: "en" }]);
      } else {
        say([{ text: "Gần đúng rồi! Đó là", lang: "vi" }, { text: wrong.en, lang: "en" }, { text: "Bé nghe lại nhé:", lang: "vi" }, { text: target.en, lang: "en" }]);
      }
    }
  }

  function next() {
    if (type === "listen") {
      if (timer.current) clearTimeout(timer.current);
      if (target && !solved.includes(target.id)) {
        setSolved((s) => [...s, target.id]);
        recordProgress(adventure.id, { wordsSeen: [target.id] });
      }
      advanceListen();
    } else if (type === "recall" && recallPhase === "look") setRecallPhase("guess");
    else if (stage < STAGES.length - 1) goStage(stage + 1);
  }

  function restart() {
    cancelSpeech();
    setQ(0);
    setSolved([]);
    goStage(0);
    setStarted(true);
  }

  function togglePause() {
    if (!paused) {
      cancelSpeech();
      if (timer.current) clearTimeout(timer.current);
    } else if (justRight && type === "listen") {
      timer.current = setTimeout(advanceListen, 1200);
    }
    setPaused(!paused);
  }

  const bloom =
    type === "intro" ? 0 : type === "listen" ? (solved.length / Math.max(1, words.length)) * 0.75 : 1;
  const mood: Mood = type === "intro" && !started ? "sleepy" : justRight || type === "celebrate" ? "cheer" : wrongId ? "think" : "happy";
  const sceneWords =
    type === "recall" && recallPhase === "guess" ? words.filter((w) => w.id !== target?.id).map((w) => w.id) : solved;
  const help = tries >= 2;
  const missing = (["vi", "en"] as const).filter((l) => voice[l] === "missing" || voice[l] === "unsupported");

  return (
    <div className={cn("storybook-lesson relative flex min-h-[100dvh] flex-col bg-sky-gradient", classroom && "pb-28")}>
      {/* Garden — the remembered moment: it transforms as the child learns */}
      <div className="pointer-events-auto absolute inset-0 z-0">
        <GardenScene bloom={bloom} revealed={sceneWords} adventure={adventure.id} onTapWord={type === "scene" ? (id) => { const w = adventure.words.find((x) => x.id === id)!; say([{ text: w.en, lang: "en" }, { text: w.sentence, lang: "en" }]); } : () => {}} />
      </div>

      {/* Stage progress */}
      <div className="relative z-10 flex items-center gap-3 px-4 pt-4 md:px-8">
        {!classroom && (
          <Link to="/adventures" aria-label="Thoát bài học" className="tactile flex h-14 w-14 items-center justify-center rounded-3xl border-2 border-border bg-card">
            <X aria-hidden />
          </Link>
        )}
        <ol className="flex flex-1 gap-1.5" aria-label="Các chặng">
          {STAGES.map((s, i) => (
            <li key={s.type} className={cn("h-4 flex-1 rounded-full border-2 border-card", i < stage ? "bg-leaf-deep" : i === stage ? "bg-sun-deep" : "bg-card/60")} aria-current={i === stage ? "step" : undefined}>
              <span className="sr-only">{s.label}</span>
            </li>
          ))}
        </ol>
        <BigButton size="icon" variant="sun" onClick={() => say(prompt())} aria-label="Nghe lại">
          <Volume2 aria-hidden className={speaking ? "animate-wiggle" : ""} />
        </BigButton>
      </div>

      {missing.length > 0 && (
        <p role="status" className="relative z-10 mx-4 mt-3 rounded-2xl bg-coral px-4 py-2 font-bold md:mx-8">
          Máy này chưa có giọng {missing.map((l) => (l === "vi" ? "tiếng Việt" : "tiếng Anh")).join(" và ")} — người lớn hãy đọc giúp bé dòng chữ bên dưới.
        </p>
      )}

      <main className="relative z-10 flex flex-1 flex-col items-center justify-end gap-4 px-4 pb-6 md:px-8">
        {(type === "intro" || type === "scene") && (
          <img className="lesson-illustration" src={`/illustrations/${adventure.id === "garden" ? "garden" : adventure.id === "colors" ? "colors" : "animals"}-card.webp`} alt="" aria-hidden="true" />
        )}
        {/* Mascot + speech bubble */}
        <div className="flex w-full max-w-4xl items-end gap-3">
          <Mascot mood={mood} talking={speaking} className="h-28 w-24 shrink-0 animate-float md:h-40 md:w-36" />
          <div className="relative mb-6 flex-1 rounded-4xl bg-card px-5 py-4 text-lg font-bold shadow-soft md:text-2xl" aria-live="polite">
            <p className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">{STAGES[stage]!.label} · {stage + 1}/6</p>
            <p>{caption || prompt().map((s) => s.text).join(" ")}</p>
            {help && target && !justRight && <p className="mt-1 text-base text-leaf-deep">Mầm gợi ý: bạn đang sáng lên chính là “{target.en}”.</p>}
          </div>
        </div>

        {/* Stage body */}
        <div className="w-full max-w-4xl">
          {type === "intro" && (
            <div className="flex flex-wrap justify-center gap-3">
              {!started ? (
                <BigButton size="xl" variant="sun" onClick={() => { setStarted(true); }}>
                  <Play aria-hidden /> Nghe Mầm kể
                </BigButton>
              ) : (
                <BigButton size="xl" onClick={() => goStage(1)}>Bắt đầu!</BigButton>
              )}
            </div>
          )}

          {(type === "listen" || (type === "recall" && recallPhase === "guess")) && target && (
            <div className={cn("grid gap-3 md:gap-5", options.length === 2 ? "grid-cols-2" : options.length === 3 ? "grid-cols-3" : "grid-cols-2 md:grid-cols-4")}>
              {options.map((id) => {
                const w = adventure.words.find((x) => x.id === id)!;
                const isTarget = id === target.id;
                return (
                  <button
                    key={id}
                    onClick={() => choose(id)}
                    disabled={paused}
                    aria-label={w.vi}
                    className={cn(
                      "tactile flex aspect-square flex-col items-center justify-center rounded-4xl border-4 bg-card p-3",
                      wrongId === id ? "animate-wiggle border-coral" : "border-card",
                      help && isTarget && !justRight && "animate-glow border-sun-deep",
                      justRight && isTarget && "border-leaf-deep bg-leaf",
                    )}
                  >
                    <WordArt id={id} className="h-3/4 w-3/4" />
                    {(justRight && isTarget) || (help && isTarget) ? <span className="font-display text-xl font-bold">{w.en}</span> : null}
                  </button>
                );
              })}
            </div>
          )}

          {type === "recall" && recallPhase === "look" && (
            <div className="flex justify-center">
              <BigButton size="xl" variant="sun" onClick={() => setRecallPhase("guess")}>Mầm nhắm mắt… 1, 2, 3!</BigButton>
            </div>
          )}
          {type === "recall" && recallPhase === "done" && (
            <div className="flex justify-center"><BigButton size="xl" onClick={() => goStage(stage + 1)}>Tiếp tục</BigButton></div>
          )}

          {type === "scene" && (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-2">
                {words.map((w) => (
                  <BigButton key={w.id} variant="paper" size="lg" onClick={() => say([{ text: w.en, lang: "en" }, { text: w.sentence, lang: "en" }])}>
                    <WordArt id={w.id} className="h-10 w-10" /> {w.en}
                  </BigButton>
                ))}
              </div>
              <BigButton size="xl" onClick={() => goStage(stage + 1)}>Tiếp tục</BigButton>
            </div>
          )}

          {type === "move" && (
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-full bg-card px-6 py-2 font-display text-4xl font-extrabold shadow-soft" aria-live="off">
                {seconds > 0 ? seconds : "Xong!"}
              </div>
              <p className="font-bold">{plan.movement ? "Vận động tại chỗ, nhẹ nhàng" : "Chơi ngồi tại chỗ"}</p>
              <BigButton size="xl" onClick={() => goStage(stage + 1)}>Xong rồi!</BigButton>
            </div>
          )}

          {type === "celebrate" && (
            <div className="flex flex-col items-center gap-4">
              <Confetti />
              <div className="flex flex-wrap justify-center gap-2">
                {words.map((w) => (
                  <span key={w.id} className="flex items-center gap-2 rounded-3xl bg-card px-4 py-2 font-display text-xl font-bold shadow-soft">
                    <WordArt id={w.id} className="h-10 w-10" /> {w.en}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <BigButton size="lg" variant="sun" onClick={() => navigate({ to: "/postcard/$id", params: { id: adventure.id } })}>
                  <Mail aria-hidden /> Xem bưu thiếp
                </BigButton>
                <BigButton size="lg" variant="paper" onClick={restart}><RotateCcw aria-hidden /> Chơi lại</BigButton>
                <BigButton size="lg" variant="paper" onClick={() => navigate({ to: "/adventures" })}><Home aria-hidden /> Phiêu lưu khác</BigButton>
              </div>
            </div>
          )}
        </div>
      </main>

      {paused && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-label="Tạm dừng">
          <div className="rounded-4xl bg-card p-8 text-center shadow-soft">
            <Mascot mood="sleepy" className="mx-auto h-32 w-28" />
            <p className="my-4 font-display text-3xl font-bold">Tạm dừng</p>
            <BigButton size="lg" onClick={togglePause}><Play aria-hidden /> Tiếp tục</BigButton>
          </div>
        </div>
      )}

      {classroom && (
        <nav aria-label="Điều khiển lớp học" className="fixed inset-x-0 bottom-0 z-40 flex flex-wrap items-center justify-center gap-2 border-t-2 border-border bg-card/95 p-3">
          <BigButton variant="paper" onClick={togglePause}>{paused ? <Play aria-hidden /> : <Pause aria-hidden />} {paused ? "Tiếp tục" : "Tạm dừng"}</BigButton>
          <BigButton variant="sun" onClick={() => say(prompt())}><Volume2 aria-hidden /> Nghe lại</BigButton>
          <BigButton variant="sky" onClick={() => { if (!started) setStarted(true); else next(); }} disabled={type === "celebrate"}><SkipForward aria-hidden /> Tiếp</BigButton>
          <BigButton variant="paper" onClick={restart}><RotateCcw aria-hidden /> Từ đầu</BigButton>
          <BigButton variant="coral" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); navigate({ to: "/teacher" }); }}><X aria-hidden /> Kết thúc</BigButton>
        </nav>
      )}
    </div>
  );
}

function Confetti() {
  const colors = ["bg-paint-red", "bg-paint-blue", "bg-paint-yellow", "bg-paint-green", "bg-coral"];
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden" aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          className={cn("absolute top-0 h-4 w-3 rounded-sm", colors[i % colors.length])}
          style={{ left: `${(i * 37) % 100}%`, animation: `confetti ${3 + (i % 4)}s linear ${i * 0.12}s 2 both` }}
        />
      ))}
    </div>
  );
}
