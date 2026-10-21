import { useSyncExternalStore } from "react";
import type { AgeBand } from "./content";

export interface Settings {
  muted: boolean;
  reduceMotion: boolean;
  age: AgeBand;
  viVoiceURI: string | null;
  enVoiceURI: string | null;
}

const KEY = "kvtt.settings.v1";
const DEFAULTS: Settings = { muted: false, reduceMotion: false, age: "4-5", viVoiceURI: null, enVoiceURI: null };

let state: Settings = DEFAULTS;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    state = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    state = DEFAULTS;
  }
}

export function getSettings(): Settings {
  load();
  return state;
}

export function updateSettings(patch: Partial<Settings>) {
  load();
  state = { ...state, ...patch };
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSettings,
    () => DEFAULTS,
  );
}
