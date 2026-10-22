import { createFileRoute } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { AdventureCard } from "@/components/AdventureCard";
import { BottomDock } from "@/components/BottomDock";
import { ADVENTURES } from "@/lib/content";
import { useProgress } from "@/lib/progress";
import { ContextPicker, ExperienceShelf } from "@/components/LearningHub";

export const Route = createFileRoute("/adventures")({
  head: () => ({
    meta: [
      { title: "Chọn phiêu lưu — Khu Vườn Tri Thức" },
      { name: "description", content: "Ba chuyến phiêu lưu tiếng Anh ngắn cho bé." },
    ],
  }),
  component: Adventures,
});

function Adventures() {
  const { standardItems } = useProgress();
  return (
    <div className="story-world storybook-page">
      <TopBar />
      <main className="story-layout storybook-page__main">
        <ContextPicker />
        <ExperienceShelf />
        <div className="storybook-page__intro">
          <span className="storybook-page__eyebrow">CÙNG MẦM ĐI KHÁM PHÁ</span>
          <h1>Bé chọn chuyến phiêu lưu nhé!</h1>
          <p>Mỗi chuyến là một câu chuyện tiếng Anh thật vui.</p>
        </div>
        <div className="adventure-grid adventure-grid--page">
          {ADVENTURES.map((a) => {
            const p = standardItems[a.id];
            const inProgress = p && p.stage > 0 && p.stage < 5;
            return (
              <AdventureCard
                key={a.id}
                adventure={a}
                action={inProgress ? "Tiếp tục" : p?.completed ? "Chơi lại" : "Vào khám phá"}
                detail={p?.completed ? "Bé đã đi hết chuyến!" : a.subtitle}
              />
            );
          })}
        </div>
      </main>
      <BottomDock />
    </div>
  );
}
