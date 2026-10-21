import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { BottomDock } from "@/components/BottomDock";
import { WordArt } from "@/components/WordArt";
import { Panel } from "@/components/kit";
import { ADVENTURES, STAGES } from "@/lib/content";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/progress")({
  head: () => ({ meta: [{ title: "Tiến trình — Khu Vườn Tri Thức" }, { name: "description", content: "Tiến trình thật đã lưu của bé." }, { property: "og:title", content: "Tiến trình" }, { property: "og:description", content: "Tiến trình thật đã lưu của bé." }] }),
  component: ProgressPage,
});

function ProgressPage() {
  const { state } = useProgress();
  return (
    <div className="storybook-page min-h-[100dvh] bg-sky-gradient">
      <TopBar />
      <main className="mx-auto max-w-4xl space-y-4 px-4 pb-32">
        <h1 className="text-4xl font-extrabold">Tiến trình đã lưu</h1>
        <p>Chỉ hiển thị dữ liệu thật đã ghi lại. “Đã gặp” không có nghĩa là đã thành thạo.</p>
        {ADVENTURES.map((a) => {
          const p = state.items[a.id];
          const words = a.words.filter((w) => p?.wordsSeen.includes(w.id));
          return (
            <Panel key={a.id}>
              <h2 className="text-2xl font-bold">{a.title}</h2>
              {!p ? <p>Chưa chơi.</p> : (
                <>
                  <p>{p.completed ? "Đã đi hết chuyến ít nhất một lần." : "Chưa đi hết chuyến."} Chặng hiện tại: {STAGES[Math.min(p.stage, 5)]?.label}. Cập nhật: {new Date(p.updatedAt).toLocaleString("vi-VN")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {words.length ? words.map((w) => <span key={w.id} className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-1 font-bold"><WordArt id={w.id} className="h-8 w-8" />{w.en}</span>) : <span>Chưa gặp từ nào.</span>}
                  </div>
                </>
              )}
            </Panel>
          );
        })}
      </main>
      <BottomDock />
    </div>
  );
}
