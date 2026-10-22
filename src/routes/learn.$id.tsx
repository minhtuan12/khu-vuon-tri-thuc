import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getAdventure } from "@/lib/content";
import { deterministicPlan, loadClassPlan, type LessonPlan } from "@/lib/plan";
import { useSettings } from "@/lib/settings";
import { getExperience, useProgress } from "@/lib/progress";
import { experiencePlan } from "@/lib/experiences";

export const Route = createFileRoute("/learn/$id")({
  validateSearch: (s: Record<string, unknown>): { mode?: "class"; experience?: string } => ({
    ...(s["mode"] === "class" ? { mode: "class" as const } : {}),
    ...(typeof s["experience"] === "string" ? { experience: s["experience"] } : {}),
  }),
  loader: ({ params }) => {
    const a = getAdventure(params.id);
    if (!a) throw notFound();
    return { title: a.title };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "Bài học"} — Khu Vườn Tri Thức` },
      { name: "description", content: "Bài học tiếng Anh dạng truyện cho bé." },
      { property: "og:title", content: loaderData?.title ?? "Bài học" },
      { property: "og:description", content: "Bài học tiếng Anh dạng truyện cho bé." },
    ],
  }),
  component: Learn,
});

function Learn() {
  const { id } = Route.useParams();
  const { mode, experience } = Route.useSearch();
  const { activeContext, contexts } = useProgress();
  const adv = getAdventure(id)!;
  const settings = useSettings();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const age = contexts.find((c) => c.id === activeContext)?.age ?? settings.age;
  useEffect(() => {
    setUnavailable(false);
    if (experience) {
      try {
        const approved = getExperience(experience);
        if (!approved || approved.request.adventureId !== adv.id) {
          setUnavailable(true);
          setPlan(null);
          return;
        }
        setPlan(experiencePlan(approved));
      } catch {
        setUnavailable(true);
        setPlan(null);
      }
      return;
    }
    setPlan(
      (mode === "class" && loadClassPlan(adv.id)) ||
        deterministicPlan(
          { adventureId: adv.id, age, duration: "standard", movement: true },
          "default",
        ),
    );
  }, [adv.id, mode, age, experience, activeContext]);
  if (unavailable)
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Chưa tìm thấy trải nghiệm đã duyệt</h1>
        <p>Nhờ người lớn mở thư viện và đồng bộ lại nhé.</p>
        <a href="/adventures" className="underline">
          Về các chuyến phiêu lưu
        </a>
      </main>
    );
  if (!plan) return <div className="min-h-[100dvh] bg-sky-gradient" />;
  return (
    <LessonPlayer
      key={`${activeContext}-${adv.id}-${plan.options}-${experience ?? "standard"}`}
      adventure={adv}
      plan={plan}
      classroom={mode === "class"}
    />
  );
}
