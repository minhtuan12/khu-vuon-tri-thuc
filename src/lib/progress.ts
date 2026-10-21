import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { AdventureId } from "./content";

export interface AdvProgress {
  stage: number; // index of the stage to resume at
  completed: boolean; // finished at least once (NOT a mastery claim)
  wordsSeen: string[];
  updatedAt: number;
}
export type SyncStatus = "local" | "syncing" | "synced" | "error";

interface State {
  items: Partial<Record<AdventureId, AdvProgress>>;
  pending: AdventureId[];
}

const KEY = "kvtt.progress.v1";
let state: State = { items: {}, pending: [] };
let loaded = false;
let status: SyncStatus = "local";
let userId: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = { items: {}, pending: [], ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    /* keep empty */
  }
}
function persist() {
  localStorage.setItem(KEY, JSON.stringify(state));
  emit();
}

/** Merge two progress records without losing anything the child encountered. */
export function mergeProgress(a: AdvProgress | undefined, b: AdvProgress | undefined): AdvProgress | undefined {
  if (!a) return b;
  if (!b) return a;
  const newer = a.updatedAt >= b.updatedAt ? a : b;
  return {
    stage: newer.stage,
    completed: a.completed || b.completed,
    wordsSeen: Array.from(new Set([...a.wordsSeen, ...b.wordsSeen])),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
  };
}

export function getProgress(id: AdventureId): AdvProgress | undefined {
  load();
  return state.items[id];
}

export function recordProgress(id: AdventureId, patch: Partial<Omit<AdvProgress, "updatedAt">>) {
  load();
  const prev = state.items[id] ?? { stage: 0, completed: false, wordsSeen: [], updatedAt: 0 };
  state.items = {
    ...state.items,
    [id]: {
      stage: patch.stage ?? prev.stage,
      completed: prev.completed || !!patch.completed,
      wordsSeen: Array.from(new Set([...prev.wordsSeen, ...(patch.wordsSeen ?? [])])),
      updatedAt: Date.now(),
    },
  };
  if (!state.pending.includes(id)) state.pending = [...state.pending, id];
  persist();
  if (userId) void syncNow();
}

export async function syncNow() {
  load();
  if (!userId || state.pending.length === 0) {
    if (userId) setStatus("synced");
    return;
  }
  setStatus("syncing");
  const ids = [...state.pending];
  const rows = ids.map((id) => {
    const p = state.items[id]!;
    return {
      owner_id: userId!,
      adventure_id: id,
      stage_index: p.stage,
      completed: p.completed,
      words_seen: p.wordsSeen,
      updated_at: new Date(p.updatedAt).toISOString(),
    };
  });
  const { error } = await supabase.from("lesson_sessions").upsert(rows, { onConflict: "owner_id,adventure_id" });
  if (error) {
    setStatus("error"); // local pending progress is kept; user can retry
    return;
  }
  state.pending = state.pending.filter((id) => !ids.includes(id));
  persist();
  setStatus("synced");
}

/** Called on sign-in: pull cloud rows, merge with device progress, push the union back. */
export async function attachUser(id: string | null) {
  load();
  userId = id;
  if (!id) {
    setStatus("local");
    return;
  }
  setStatus("syncing");
  const { data, error } = await supabase
    .from("lesson_sessions")
    .select("adventure_id, stage_index, completed, words_seen, updated_at");
  if (error) {
    setStatus("error");
    return;
  }
  for (const r of data ?? []) {
    const aid = r.adventure_id as AdventureId;
    const remote: AdvProgress = {
      stage: r.stage_index,
      completed: r.completed,
      wordsSeen: r.words_seen ?? [],
      updatedAt: new Date(r.updated_at).getTime(),
    };
    const local = state.items[aid];
    const merged = mergeProgress(local, remote)!;
    state.items = { ...state.items, [aid]: merged };
    const differs = !local || local.updatedAt > remote.updatedAt || merged.wordsSeen.length !== remote.wordsSeen.length;
    if (differs && local && !state.pending.includes(aid)) state.pending.push(aid);
  }
  for (const aid of Object.keys(state.items) as AdventureId[]) {
    if (!(data ?? []).some((r) => r.adventure_id === aid) && !state.pending.includes(aid)) state.pending.push(aid);
  }
  persist();
  await syncNow();
}

function setStatus(s: SyncStatus) {
  status = s;
  emit();
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
let snap: { state: State; status: SyncStatus } = { state, status };
function getSnap() {
  load();
  if (snap.state !== state || snap.status !== status) snap = { state, status };
  return snap;
}
const empty = { state: { items: {}, pending: [] } as State, status: "local" as SyncStatus };

export function useProgress() {
  return useSyncExternalStore(subscribe, getSnap, () => empty);
}
