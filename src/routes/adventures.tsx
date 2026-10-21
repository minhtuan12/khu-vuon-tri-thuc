import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { WordArt } from "@/components/WordArt";
import { ADVENTURES } from "@/lib/content";
import { recordProgress, useProgress } from "@/lib/progress";
import { BigButton } from "@/components/kit";

export const Route = createFileRoute("/adventures")({
  head: () => ({ meta: [{ title: "Chọn phiêu lưu — Khu Vườn Tri Thức" }, { name: "description", content: "Ba chuyến phiêu lưu tiếng Anh ngắn cho bé." }, { property: "og:title", content: "Chọn phiêu lưu" }, { property: "og:description", content: "Ba chuyến phiêu lưu tiếng Anh ngắn cho bé." }] }),
  component: Adventures,
});

function Adventures() {
  const { state } = useProgress();
  return (
    <div className="min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 pb-12">
        <h1 className="mb-6 text-center text-4xl font-extrabold md:text-5xl">Bé chọn chuyến phiêu lưu nhé!</h1>
        <div className="grid gap-5 md:grid-cols-3">
          {ADVENTURES.map((a) => {
            const p = state.items[a.id];
            const inProgress = p && p.stage > 0 && p.stage < 5;
            return (
              <article key={a.id} className="flex flex-col rounded-4xl bg-card p-5 shadow-soft">
                <div className="grid grid-cols-4 gap-1">{a.words.map((w) => <WordArt key={w.id} id={w.id} className="aspect-square w-full" />)}</div>
                <h2 className="mt-3 text-2xl font-bold">{a.title}</h2>
                <p className="mb-2">{a.subtitle}</p>
                {p?.completed && <p className="mb-2 text-sm font-bold text-leaf-deep">Đã đi hết chuyến</p>}
                <div className="mt-auto flex flex-wrap gap-2">
                  <Link to="/learn/$id" params={{ id: a.id }} className="tactile inline-flex flex-1 items-center justify-center rounded-3xl bg-primary px-5 py-3 font-display text-xl font-bold text-primary-foreground">
                    {inProgress ? "Tiếp tục" : p?.completed ? "Chơi lại" : "Bắt đầu"}
                  </Link>
                  {inProgress && <BigButton variant="paper" onClick={() => recordProgress(a.id, { stage: 0 })}>Từ đầu</BigButton>}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
