import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { GardenScene } from "@/components/GardenScene";
import { Mascot } from "@/components/Mascot";
import { WordArt } from "@/components/WordArt";
import { bigButton } from "@/components/kit";
import { ADVENTURES } from "@/lib/content";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khu Vườn Tri Thức — Trường Mầm Non Tô Hiến Thành" },
      { name: "description", content: "Bé 3–6 tuổi cùng bạn Mầm đánh thức khu vườn bằng tiếng Anh." },
      { property: "og:title", content: "Khu Vườn Tri Thức" },
      { property: "og:description", content: "Khu vườn truyện tranh học tiếng Anh cho bé mầm non." },
    ],
  }),
  component: Index,
});

function Index() {
  const { state } = useProgress();
  const resume = ADVENTURES.find((a) => { const p = state.items[a.id]; return p && p.stage > 0 && p.stage < 5; });
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-sky-gradient">
      <div className="absolute inset-x-0 bottom-0 h-[55vh]"><GardenScene bloom={0.7} revealed={["sun"]} /></div>
      <TopBar />
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-4 pt-4 text-center">
        <p className="rounded-full bg-card px-4 py-1.5 font-bold shadow-soft">Trường Mầm Non Tô Hiến Thành</p>
        <h1 className="mt-3 text-5xl font-extrabold leading-none md:text-7xl">Khu Vườn Tri Thức</h1>
        <Mascot className="mt-2 h-36 w-32 animate-float" />
        <Link to="/adventures" className={bigButton({ size: "xl", variant: "sun" })}>Cùng khám phá</Link>
        {resume && (
          <Link to="/learn/$id" params={{ id: resume.id }} className={bigButton({ size: "md", variant: "leaf", className: "mt-3" })}>
            Tiếp tục: {resume.title}
          </Link>
        )}
        <div className="mt-6 grid w-full gap-3 sm:grid-cols-3">
          {ADVENTURES.map((a) => (
            <Link key={a.id} to="/learn/$id" params={{ id: a.id }} className="tactile flex items-center gap-3 rounded-4xl bg-card p-4 text-left">
              <WordArt id={a.words[0]!.id} className="h-14 w-14" />
              <span><span className="block font-display text-xl font-bold">{a.title}</span><span className="text-sm">{a.subtitle}</span></span>
            </Link>
          ))}
        </div>
        <Link to="/teacher" className="mt-4 mb-10 min-h-14 rounded-2xl bg-card/80 px-4 py-3 font-bold underline">Dành cho giáo viên & phụ huynh</Link>
      </main>
    </div>
  );
}
