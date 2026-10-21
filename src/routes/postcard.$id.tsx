import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { WordArt } from "@/components/WordArt";
import { Mascot } from "@/components/Mascot";
import { BigButton } from "@/components/kit";
import { getAdventure } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";

export const Route = createFileRoute("/postcard/$id")({
  loader: ({ params }) => { const a = getAdventure(params.id); if (!a) throw notFound(); return { title: a.title }; },
  head: ({ loaderData }) => ({ meta: [{ title: `Bưu thiếp: ${loaderData?.title ?? ""} — Khu Vườn Tri Thức` }, { name: "description", content: "Từ bé đã gặp và hoạt động gợi ý tại nhà." }, { property: "og:title", content: "Bưu thiếp khu vườn" }, { property: "og:description", content: "Từ bé đã gặp và hoạt động gợi ý tại nhà." }] }),
  component: Postcard,
});

function Postcard() {
  const { id } = Route.useParams();
  const a = getAdventure(id)!;
  const { state } = useProgress();
  const seen = state.items[a.id]?.wordsSeen ?? [];
  const words = a.words.filter((w) => seen.includes(w.id));
  return (
    <div className="storybook-page min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-3xl px-4 pb-12">
        <article className="rounded-4xl border-8 border-sun bg-card p-6 shadow-soft">
          <img className="postcard-art" src={`/illustrations/${a.id === "garden" ? "garden" : a.id === "colors" ? "colors" : "animals"}-card.webp`} alt="" />
          <div className="flex items-center gap-4"><Mascot mood="cheer" className="h-28 w-24" /><div><p className="font-bold">Bưu thiếp từ khu vườn</p><h1 className="text-3xl font-extrabold">{a.title}</h1></div></div>
          <h2 className="mt-4 text-xl font-bold">Các từ bé đã gặp</h2>
          {words.length === 0 ? <p>Bé chưa gặp từ nào trong chuyến này. <Link className="underline" to="/learn/$id" params={{ id: a.id }}>Bắt đầu chơi</Link></p> : (
            <div className="mt-2 flex flex-wrap gap-2">{words.map((w) => (
              <BigButton key={w.id} variant="paper" onClick={() => speak([{ text: w.en, lang: "en" }])}><WordArt id={w.id} className="h-10 w-10" />{w.en} · {w.vi}</BigButton>
            ))}</div>
          )}
          <p className="mt-3 rounded-2xl bg-muted p-3 text-sm">“Đã gặp” nghĩa là bé đã nghe và chơi với từ này — không có nghĩa bé đã thành thạo. Giáo viên quan sát và ghi nhận riêng.</p>
          <h2 className="mt-4 text-xl font-bold">Chơi cùng bé tại nhà (không cần màn hình)</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6">{a.parentActivity.map((t) => <li key={t}>{t}</li>)}</ul>
          <div className="mt-5 flex flex-wrap gap-2 print:hidden">
            <BigButton variant="sun" onClick={() => window.print()}>In bưu thiếp</BigButton>
            <Link to="/adventures" className="tactile inline-flex items-center rounded-3xl bg-primary px-5 py-3 font-bold text-primary-foreground">Phiêu lưu khác</Link>
          </div>
        </article>
      </main>
    </div>
  );
}
