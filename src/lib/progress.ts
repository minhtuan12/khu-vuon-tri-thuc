import { useSyncExternalStore } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { getAdventure, isRoadmapExperience, type AdventureId } from "./content";
import {
  approvedExperienceSchema,
  validateExperience,
  type ApprovedExperience,
} from "./experiences";

export interface AdvProgress {
  stage: number;
  completed: boolean;
  wordsSeen: string[];
  updatedAt: number;
  branch?: string | undefined;
}
export type SyncStatus = "local" | "syncing" | "synced" | "error";
const contextSchema = z.object({
  id: z.string().uuid(),
  kind: z.enum(["learner", "class"]),
  name: z.string().trim().min(1).max(30),
  age: z.enum(["3-4", "4-5", "5-6"]),
  learnerId: z.string().uuid().nullable().optional(),
});
export type LearningContext = z.infer<typeof contextSchema>;
const eventSchema = z.object({
  id: z.string().uuid(),
  contextId: z.string(),
  adventureId: z.enum(["garden", "colors", "train"]),
  experienceId: z.string(),
  wordId: z.string().optional(),
  kind: z.enum(["attempt", "hint", "seen", "complete", "note", "practice"]),
  correct: z.boolean().optional(),
  note: z.string().max(500).optional(),
  at: z.number().finite(),
});
export type ActivityEvent = z.infer<typeof eventSchema>;
const progressSchema = z.object({
  stage: z.number().int().min(0).max(5),
  completed: z.boolean(),
  wordsSeen: z.array(z.string()).max(20),
  updatedAt: z.number().finite(),
  branch: z.string().optional(),
});
const dataSchema = z.object({
  contexts: z.array(contextSchema).max(500),
  experiences: z.array(approvedExperienceSchema).max(1000),
  progress: z.record(progressSchema),
  events: z.array(eventSchema).max(50000),
});
type Data = z.infer<typeof dataSchema>;
const fresh = (): Data => ({ contexts: [], experiences: [], progress: {}, events: [] });
let data = fresh();
let userId: string | null = null;
let initialized = false;
let activeContext = "shared";
let status: SyncStatus = "local";
let generation = 0;
let syncFlight: Promise<void> | null = null;
let revision = 0;
let dirty = false;
const listeners = new Set<() => void>();
const json = (value: unknown): Json => JSON.parse(JSON.stringify(value)) as Json;
const storageKey = () => `kvtt.learning.v2.${userId ?? "guest"}`;
let snap = makeSnapshot();
const serverSnap = snap;
function makeSnapshot() {
  const items: Partial<Record<AdventureId, AdvProgress>> = {};
  const standardItems: Partial<Record<AdventureId, AdvProgress>> = {};
  for (const [key, value] of Object.entries(data.progress)) {
    const [context, adventure] = key.split("/");
    if (context === activeContext && key.endsWith("/standard"))
      standardItems[adventure as AdventureId] = value;
    if (context === activeContext && getAdventure(adventure!))
      items[adventure as AdventureId] = mergeProgress(items[adventure as AdventureId], value)!;
  }
  return {
    state: { items, pending: dirty ? Object.keys(items) : [] },
    standardItems,
    contextProgress: Object.fromEntries(
      Object.entries(data.progress)
        .filter(([key]) => key.startsWith(`${activeContext}/`))
        .map(([key, value]) => [key.slice(activeContext.length + 1), value]),
    ),
    status,
    contexts: data.contexts,
    experiences: data.experiences,
    events: data.events.filter((e) => e.contextId === activeContext),
    activeContext,
    revision,
  };
}
function emit() {
  snap = makeSnapshot();
  listeners.forEach((fn) => fn());
}
function persist() {
  revision++;
  dirty = true;
  try {
    localStorage.setItem(storageKey(), JSON.stringify(data));
  } catch {
    status = "error";
  }
  emit();
}
function read() {
  data = fresh();
  activeContext = "shared";
  try {
    const saved = localStorage.getItem(storageKey());
    if (saved) data = dataSchema.parse(JSON.parse(saved));
    else if (!userId) {
      const old = JSON.parse(localStorage.getItem("kvtt.progress.v1") || "{}");
      for (const [id, p] of Object.entries(old.items || {}))
        if (getAdventure(id)) data.progress[`shared/${id}/standard`] = progressSchema.parse(p);
    }
    const selected = localStorage.getItem(`${storageKey()}.context`);
    if (selected && data.contexts.some((c) => c.id === selected)) activeContext = selected;
  } catch {
    status = "error";
  }
  dirty = true;
}
function load() {
  if (!initialized && typeof window !== "undefined") {
    initialized = true;
    read();
    emit();
  }
}
export function mergeProgress(
  a: AdvProgress | undefined,
  b: AdvProgress | undefined,
): AdvProgress | undefined {
  if (!a) return b;
  if (!b) return a;
  return {
    ...(a.updatedAt >= b.updatedAt ? a : b),
    completed: a.completed || b.completed,
    wordsSeen: [...new Set([...a.wordsSeen, ...b.wordsSeen])],
  };
}
export function selectContext(id: string) {
  load();
  if (id !== "shared" && !data.contexts.some((c) => c.id === id))
    throw new Error("Hồ sơ không hợp lệ");
  activeContext = id;
  try {
    localStorage.setItem(`${storageKey()}.context`, id);
  } catch {
    status = "error";
  }
  emit();
}
export function addContext(input: Omit<LearningContext, "id">) {
  load();
  const item = contextSchema.parse({ ...input, id: crypto.randomUUID() });
  data = { ...data, contexts: [...data.contexts, item] };
  persist();
  void syncNow();
  return item;
}
export function getProgress(id: AdventureId, experienceId = "standard") {
  load();
  return data.progress[`${activeContext}/${id}/${experienceId}`];
}
export function recordProgress(
  id: AdventureId,
  patch: Partial<Omit<AdvProgress, "updatedAt">>,
  experienceId = "standard",
) {
  load();
  const key = `${activeContext}/${id}/${experienceId}`;
  const prev = data.progress[key] ?? { stage: 0, completed: false, wordsSeen: [], updatedAt: 0 };
  data = {
    ...data,
    progress: {
      ...data.progress,
      [key]: {
        ...prev,
        ...patch,
        completed: prev.completed || !!patch.completed,
        wordsSeen: [...new Set([...prev.wordsSeen, ...(patch.wordsSeen ?? [])])],
        updatedAt: Date.now(),
      },
    },
  };
  persist();
  void syncNow();
}
export function recordActivity(input: Omit<ActivityEvent, "id" | "at" | "contextId">) {
  load();
  const event = eventSchema.parse({
    ...input,
    id: crypto.randomUUID(),
    at: Date.now(),
    contextId: activeContext,
  });
  data = { ...data, events: [...data.events, event] };
  persist();
  void syncNow();
}
export function cacheExperience(item: ApprovedExperience) {
  load();
  approvedExperienceSchema.parse(item);
  validateExperience(item.proposal, item.request);
  data = { ...data, experiences: [...data.experiences.filter((e) => e.id !== item.id), item] };
  persist();
}
export function getExperience(id: string) {
  load();
  const item = data.experiences.find((e) => e.id === id);
  if (item) validateExperience(item.proposal, item.request);
  return item;
}
export function reviewSignals(id: AdventureId) {
  load();
  return getAdventure(id)!
    .words.map((w) => {
      const events = data.events.filter(
        (e) => e.contextId === activeContext && e.adventureId === id && e.wordId === w.id,
      );
      return {
        wordId: w.id,
        attempts: Math.min(10000, events.filter((e) => e.kind === "attempt").length),
        hints: Math.min(10000, events.filter((e) => e.kind === "hint").length),
      };
    })
    .sort((a, b) => b.hints - a.hints || a.attempts - b.attempts);
}
export function exportLearningData() {
  load();
  return JSON.stringify({ app: "kvtt", version: 2, data }, null, 2);
}
export function restoreLearningData(raw: string) {
  load();
  const backup = z
    .object({ app: z.literal("kvtt"), version: z.literal(2), data: dataSchema })
    .parse(JSON.parse(raw));
  const known = new Set(data.experiences.map((e) => e.id));
  for (const [key, p] of Object.entries(backup.data.progress)) {
    const [context, adv, experience] = key.split("/");
    if (
      !getAdventure(adv!) ||
      (context !== "shared" && !backup.data.contexts.some((c) => c.id === context)) ||
      (experience !== "standard" &&
        !known.has(experience!) &&
        !isRoadmapExperience(adv!, experience!)) ||
      p.wordsSeen.some((w) => !getAdventure(adv!)!.words.some((v) => v.id === w))
    )
      throw new Error("Bản sao lưu chứa tiến độ hoặc trải nghiệm không hợp lệ");
  }
  for (const e of backup.data.events)
    if (
      (e.contextId !== "shared" && !backup.data.contexts.some((c) => c.id === e.contextId)) ||
      (e.wordId && !getAdventure(e.adventureId)!.words.some((w) => w.id === e.wordId))
    )
      throw new Error("Sự kiện không hợp lệ");
  data = { ...backup.data, experiences: data.experiences };
  activeContext = "shared";
  persist();
  void syncNow();
}
export function activityCSV() {
  load();
  const quote = (v: unknown) =>
    '"' +
    String(v ?? "")
      .replace(/^[=+@-]/, "'$&")
      .replace(/"/g, '""') +
    '"';
  return (
    "\uFEFF" +
    [
      ["Ngày", "Ngữ cảnh", "Thế giới", "Loại", "Từ", "Ghi chú"],
      ...data.events.map((e) => [
        new Date(e.at).toISOString(),
        data.contexts.find((c) => c.id === e.contextId)?.name ?? "Chơi chung",
        e.adventureId,
        e.kind,
        e.wordId,
        e.note,
      ]),
    ]
      .map((row) => row.map(quote).join(","))
      .join("\n")
  );
}
export async function syncNow(): Promise<void> {
  load();
  if (!userId) return;
  if (syncFlight) {
    await syncFlight;
    if (dirty && status !== "error") return syncNow();
    return;
  }
  const epoch = generation,
    owner = userId,
    captured = revision,
    copy = data;
  status = "syncing";
  emit();
  syncFlight = (async () => {
    try {
      for (const c of copy.contexts) {
        if (epoch !== generation) return;
        const { error } = await supabase.rpc("save_learning_context", { item: json(c) });
        if (error) throw error;
      }
      for (const [key, p] of Object.entries(copy.progress)) {
        if (epoch !== generation) return;
        const [context, adventure, experience] = key.split("/");
        const { error } = await supabase.rpc("save_learning_progress", {
          context_key: context!,
          adventure: adventure!,
          experience: experience!,
          item: json(p),
        });
        if (error) throw error;
      }
      for (const event of copy.events) {
        if (epoch !== generation) return;
        const { error } = await supabase.rpc("save_learning_event", { item: json(event) });
        if (error) throw error;
      }
      if (epoch === generation && owner === userId) {
        dirty = revision !== captured;
        status = "synced";
        emit();
      }
    } catch {
      if (epoch === generation) {
        status = "error";
        emit();
      }
    }
  })();
  await syncFlight;
  syncFlight = null;
  if (epoch === generation && dirty && (status as SyncStatus) !== "error") await syncNow();
}
export async function attachUser(id: string | null) {
  load();
  if (id === userId) {
    if (id) void syncNow();
    return;
  }
  generation++;
  const epoch = generation;
  userId = id;
  status = id ? "syncing" : "local";
  read();
  revision++;
  emit();
  if (!id) return;
  const [{ data: remote, error }, { data: legacy, error: legacyError }] = await Promise.all([
    supabase.rpc("learning_snapshot"),
    supabase
      .from("lesson_sessions")
      .select("adventure_id,stage_index,completed,words_seen,updated_at"),
  ]);
  if (epoch !== generation) return;
  if (error || legacyError) {
    status = "error";
    emit();
    return;
  }
  try {
    const cloud = dataSchema.parse(remote);
    const progress = { ...data.progress };
    for (const r of legacy ?? []) {
      const key = `shared/${r.adventure_id}/standard`;
      if (!progress[key] && !cloud.progress[key])
        progress[key] = {
          stage: Math.min(5, r.stage_index),
          completed: r.completed,
          wordsSeen: r.words_seen,
          updatedAt: new Date(r.updated_at).getTime(),
        };
    }
    for (const [key, p] of Object.entries(cloud.progress))
      progress[key] = mergeProgress(progress[key], p)!;
    const combine = <T extends { id: string }>(a: T[], b: T[]) => [
      ...new Map([...a, ...b].map((v) => [v.id, v])).values(),
    ];
    data = {
      contexts: combine(cloud.contexts, data.contexts),
      experiences: cloud.experiences,
      progress,
      events: combine(cloud.events, data.events),
    };
    persist();
    await syncNow();
  } catch {
    status = "error";
    emit();
  }
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function useProgress() {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return snap;
    },
    () => serverSnap,
  );
}
