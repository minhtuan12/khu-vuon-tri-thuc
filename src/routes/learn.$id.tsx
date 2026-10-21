import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LessonPlayer } from "@/components/LessonPlayer";
import { getAdventure } from "@/lib/content";
import { deterministicPlan, loadClassPlan, type LessonPlan } from "@/lib/plan";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/learn/$id")({
  validateSearch: (s: Record<string, unknown>): { mode?: "class" } => (s['mode'] === "class" ? { mode: "class" } : {}),
  loader: ({ params }) => {
    const a = getAdventure(params.id);
    if (!a) throw notFound();
    return { title: a.title };
  },
  head: ({ loaderData }) => ({ meta: [{ title: `${loaderData?.title ?? "Bài học"} — Khu Vườn Tri Thức` }, { name: "description", content: "Bài học tiếng Anh dạng truyện cho bé." }, { property: "og:title", content: loaderData?.title ?? "Bài học" }, { property: "og:description", content: "Bài học tiếng Anh dạng truyện cho bé." }] }),
  component: Learn,
});

function Learn() {
  const { id } = Route.useParams();
  const { mode } = Route.useSearch();
  const adv = getAdventure(id)!;
  const settings = useSettings();
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  useEffect(() => {
    setPlan((mode === "class" && loadClassPlan(adv.id)) || deterministicPlan({ adventureId: adv.id, age: settings.age, duration: "standard", movement: true }, "default"));
  }, [adv.id, mode, settings.age]);
  if (!plan) return <div className="min-h-[100dvh] bg-sky-gradient" />;
  return <LessonPlayer key={`${adv.id}-${plan.options}`} adventure={adv} plan={plan} classroom={mode === "class"} />;
}
