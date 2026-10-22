import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Ear,
  Flower2,
  MessageCircle,
  MousePointer2,
  Sparkles,
} from "lucide-react";
import {
  ADVENTURES,
  getAdventure,
  LEARNING_WORLDS,
  roadmapKey,
  type AdventureId,
} from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { useSettings } from "@/lib/settings";
import { useUser } from "@/lib/auth";
import { TopBar, SyncBadge } from "@/components/TopBar";
import { BottomDock } from "@/components/BottomDock";
import { ContextPicker } from "@/components/LearningHub";
import { Mascot } from "@/components/Mascot";
import { WordArt } from "@/components/WordArt";
import { RoadmapLesson } from "@/components/RoadmapLesson";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/roadmap")({
  validateSearch: (s: Record<string, unknown>): { world?: AdventureId; lesson?: string } => ({
    ...(typeof s["world"] === "string" && getAdventure(s["world"])
      ? { world: s["world"] as AdventureId }
      : {}),
    ...(typeof s["lesson"] === "string" ? { lesson: s["lesson"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Lộ trình của bé — Khu Vườn Tri Thức" },
      {
        name: "description",
        content: "12 bài học nhỏ: nghe tiếng Anh, nói theo và chọn từ cùng Mầm.",
      },
    ],
  }),
  component: Roadmap,
});

function Roadmap() {
  const { world = "garden", lesson } = Route.useSearch();
  const navigate = useNavigate();
  const { contexts, activeContext, contextProgress } = useProgress();
  const { user } = useUser();
  const settings = useSettings();
  const [ready, setReady] = useState(false);
  const lastLesson = useRef(lesson);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (lesson) lastLesson.current = lesson;
  }, [lesson]);
  const adventure = getAdventure(world)!;
  const theme = LEARNING_WORLDS.find((w) => w.id === world)!;
  const word = adventure.words.find((w) => w.id === lesson);
  const context = contexts.find((c) => c.id === activeContext);
  const done = (id: string) => !!contextProgress[`${world}/${roadmapKey(id)}`]?.completed;
  const completed = adventure.words.filter((w) => done(w.id)).length;
  const next = adventure.words.find((w) => !done(w.id)) ?? adventure.words[0]!;
  const total = ADVENTURES.reduce(
    (n, a) =>
      n + a.words.filter((w) => contextProgress[`${a.id}/${roadmapKey(w.id)}`]?.completed).length,
    0,
  );
  function open(id: string) {
    void navigate({ to: "/roadmap", search: { world, lesson: id } });
  }
  function close() {
    void navigate({ to: "/roadmap", search: { world }, replace: true });
  }

  return (
    <div className="story-world storybook-page roadmap-page" data-ready={ready}>
      <TopBar />
      <main className="roadmap-layout">
        <div className="roadmap-topline">
          <span className="path-eyebrow">
            <Sparkles size={16} aria-hidden /> MỖI NGÀY MỘT KHÁM PHÁ
          </span>
          <Link to="/adventures">
            Các chuyến phiêu lưu <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <section className="roadmap-welcome">
          <div>
            <h1>
              Lớn lên cùng
              <br />
              <span>từng từ nhỏ.</span>
            </h1>
            <p>
              Một chút lắng nghe, một lần thử nói.
              <br />
              Cùng Mầm làm khu vườn tiếng Anh nở hoa!
            </p>
            <div className="roadmap-skills">
              <span>
                <Ear aria-hidden size={18} /> Nghe
              </span>
              <span>
                <MessageCircle aria-hidden size={18} /> Nói theo
              </span>
              <span>
                <MousePointer2 aria-hidden size={18} /> Chọn đúng
              </span>
            </div>
          </div>
          <div className="roadmap-welcome__art">
            <img
              src="/illustrations/garden-story.jpg"
              alt="Khu vườn xanh với cây táo và những bông hoa"
            />
            <div className="roadmap-mam">
              <Mascot mood="cheer" />
              <span>Let's grow together!</span>
            </div>
          </div>
        </section>
        <div className="roadmap-context">
          <ContextPicker />
          <span className="roadmap-flowers">
            <Flower2 aria-hidden /> <strong>{total}/12</strong> bông hoa khám phá
          </span>
        </div>
        <nav className="roadmap-worlds" aria-label="Chọn khu vườn">
          {LEARNING_WORLDS.map((w, i) => (
            <Link
              key={w.id}
              to="/roadmap"
              search={{ world: w.id }}
              aria-current={world === w.id ? "page" : undefined}
              className={`roadmap-world ${world === w.id ? "is-selected" : ""}`}
            >
              <img src={w.image} alt="" />
              <span>
                <small>Khu vườn {i + 1}</small>
                <strong>{w.name}</strong>
              </span>
              {world === w.id && <Check size={18} aria-hidden />}
            </Link>
          ))}
        </nav>
        <section className={`roadmap-garden roadmap-garden--${world}`} aria-labelledby="path-title">
          <div className="roadmap-garden__header">
            <div>
              <span className="path-eyebrow">{theme.badge} · 4 BÀI HỌC NHỎ</span>
              <h2 id="path-title">{theme.title}</h2>
              <p>{theme.description}</p>
            </div>
            <div className="roadmap-bouquet" aria-label={`${completed} trên 4 bài đã trải nghiệm`}>
              {adventure.words.map((w) => (
                <Flower2 key={w.id} className={done(w.id) ? "is-bloomed" : ""} aria-hidden />
              ))}
              <span>{completed}/4 đã khám phá</span>
            </div>
          </div>
          <div className="roadmap-trail">
            <svg
              className="roadmap-trail__line"
              viewBox="0 0 1000 300"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path d="M125 145 C210 145 255 230 375 230 S510 85 625 85 S790 200 875 200" />
            </svg>
            <ol>
              {adventure.words.map((w, i) => {
                const p = contextProgress[`${world}/${roadmapKey(w.id)}`];
                const current = w.id === next.id;
                return (
                  <li
                    key={w.id}
                    className={`roadmap-stop roadmap-stop--${i} ${done(w.id) ? "is-complete" : ""} ${current ? "is-next" : ""}`}
                  >
                    <span className="roadmap-stop__tag">
                      {done(w.id) ? "Đã khám phá" : current ? "Mầm chờ bé ở đây!" : `Bài ${i + 1}`}
                    </span>
                    <button
                      id={`path-${w.id}`}
                      disabled={!ready}
                      className="roadmap-stop__button"
                      onClick={() => open(w.id)}
                      aria-label={`Học bài ${i + 1}: ${w.en}${done(w.id) ? " · Đã khám phá" : ""}`}
                    >
                      <WordArt id={w.id} />
                      <span className="roadmap-stop__number">
                        {done(w.id) ? <Check size={20} aria-hidden /> : i + 1}
                      </span>
                    </button>
                    <h3 lang="en">{w.en}</h3>
                    <span className="roadmap-stop__caption">
                      {p && !p.completed ? "Tiếp tục bài học" : "Nghe · Nói · Chọn"}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="roadmap-garden__footer">
            <span>
              <Flower2 aria-hidden /> Bé có thể chọn bất kỳ bài nào và học lại thoải mái.
            </span>
            <button className="roadmap-start" disabled={!ready} onClick={() => open(next.id)}>
              {completed === 4 ? "Cùng chơi lại" : "Đi cùng Mầm"}
              <ArrowRight aria-hidden size={20} />
            </button>
          </div>
        </section>
        <div className="roadmap-note">
          <p>Hoa ghi lại những lần bé trải nghiệm, không phải điểm số hay chứng nhận thành thạo.</p>
          <SyncBadge />
        </div>
      </main>
      <BottomDock />
      <Dialog
        open={!!lesson && ready}
        onOpenChange={(v) => {
          if (!v) close();
        }}
      >
        <DialogContent
          className="roadmap-dialog"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById(`path-${lastLesson.current}`)?.focus();
          }}
        >
          <DialogTitle className="sr-only">
            {word ? `Learn ${word.en}` : "Lesson not found"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Listen, speak along and choose the right word. Progress is saved for the selected
            learner.
          </DialogDescription>
          {word ? (
            <RoadmapLesson
              key={`${user?.id ?? "guest"}/${activeContext}/${world}/${word.id}`}
              adventure={adventure}
              word={word}
              age={context?.age ?? settings.age}
              onDone={close}
            />
          ) : (
            <div className="p-8">
              <h2>Lesson not found</h2>
              <p>Please choose a lesson from your learning path.</p>
              <button className="roadmap-start" onClick={close}>
                Back to my path
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
