import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Heart, Sparkles } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { AdventureCard } from "@/components/AdventureCard";
import { BottomDock } from "@/components/BottomDock";
import { ADVENTURES } from "@/lib/content";
import { useProgress } from "@/lib/progress";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Khu Vườn Tri Thức — Trường Mầm Non Tô Hiến Thành" },
      {
        name: "description",
        content: "Bé cùng khám phá tiếng Anh qua những chuyến phiêu lưu đầy sắc màu.",
      },
      { property: "og:title", content: "Khu Vườn Tri Thức" },
    ],
  }),
  component: Index,
});

function Index() {
  const { standardItems } = useProgress();
  const resume = ADVENTURES.find((a) => {
    const p = standardItems[a.id];
    return p && p.stage > 0 && p.stage < 5;
  });
  return (
    <div className="story-world story-home">
      <TopBar />
      <main className="story-layout">
        <h1 className="sr-only">Khu Vườn Tri Thức — cùng bé học tiếng Anh</h1>
        <section className="story-hero" aria-labelledby="hero-welcome">
          <div className="story-hero__bubble">
            <span className="story-hero__sparkle">
              <Sparkles aria-hidden size={28} />
            </span>
            <div>
              <h2 id="hero-welcome">Chào mừng các bé!</h2>
              <p>Hôm nay mình cùng bước vào một chuyến phiêu lưu tiếng Anh nhé!</p>
            </div>
          </div>
          <div className="story-hero__actions">
            <Link className="story-hero__cta" to="/adventures">
              Cùng khám phá <ArrowRight size={23} aria-hidden />
            </Link>
            <Link className="story-hero__resume" to="/roadmap">
              Lộ trình của bé <ArrowRight size={18} aria-hidden />
            </Link>
            {resume && (
              <Link className="story-hero__resume" to="/learn/$id" params={{ id: resume.id }}>
                Tiếp tục: {resume.title}
              </Link>
            )}
          </div>
        </section>

        <section aria-labelledby="adventures-title" className="story-section">
          <div className="story-section__head">
            <h2 id="adventures-title">Ba thế giới đang chờ bé</h2>
            <span>Chọn một câu chuyện để bắt đầu</span>
          </div>
          <div className="adventure-grid">
            {ADVENTURES.map((a) => (
              <AdventureCard key={a.id} adventure={a} />
            ))}
          </div>
        </section>

        <section className="quick-grid" aria-label="Dành cho cô và gia đình">
          <Link to="/teacher" className="quick-card quick-card--teacher">
            <span className="quick-card__icon">
              <BookOpen aria-hidden />
            </span>
            <span>
              <strong>Góc người lớn</strong>
              <small>Ở lớp · Tại nhà · Chuẩn bị bài</small>
            </span>
            <ArrowRight aria-hidden size={20} />
          </Link>
          <Link to="/progress" className="quick-card quick-card--progress">
            <span className="quick-card__icon">
              <Sparkles aria-hidden />
            </span>
            <span>
              <strong>Vườn của bé</strong>
              <small>Những điều bé đã khám phá</small>
            </span>
            <ArrowRight aria-hidden size={20} />
          </Link>
          <Link to="/about" className="quick-card quick-card--parent">
            <span className="quick-card__icon">
              <Heart aria-hidden />
            </span>
            <span>
              <strong>Góc phụ huynh</strong>
              <small>Cùng bé học trong ngày</small>
            </span>
            <ArrowRight aria-hidden size={20} />
          </Link>
        </section>
      </main>
      <BottomDock />
    </div>
  );
}
