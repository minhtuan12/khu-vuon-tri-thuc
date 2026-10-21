// Shared speech engine built on the browser's speechSynthesis (text-to-speech only).
// It never listens to the child and never assesses pronunciation.
import { useEffect, useState, useSyncExternalStore } from "react";
import { getSettings } from "./settings";

export type Lang = "vi" | "en";
export interface Segment {
  text: string;
  lang: Lang;
}

const LANG_TAG: Record<Lang, string> = { vi: "vi-VN", en: "en-US" };
const RATE: Record<Lang, number> = { vi: 0.95, en: 0.8 };

type VoiceStatus = "loading" | "ok" | "missing" | "unsupported";

let voices: SpeechSynthesisVoice[] = [];
let voicesReady = false;
let speaking = false;
let token = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function isSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/** Load voices, waiting briefly for the async voiceschanged event. */
export function loadVoices(timeoutMs = 1500): Promise<SpeechSynthesisVoice[]> {
  if (!isSupported()) return Promise.resolve([]);
  const now = window.speechSynthesis.getVoices();
  if (now.length) {
    voices = now;
    voicesReady = true;
    emit();
    return Promise.resolve(voices);
  }
  return new Promise((resolve) => {
    const done = () => {
      voices = window.speechSynthesis.getVoices();
      voicesReady = true;
      window.speechSynthesis.removeEventListener("voiceschanged", done);
      emit();
      resolve(voices);
    };
    window.speechSynthesis.addEventListener("voiceschanged", done);
    setTimeout(done, timeoutMs);
  });
}

export function voicesFor(lang: Lang): SpeechSynthesisVoice[] {
  const tag = LANG_TAG[lang].toLowerCase();
  const prefix = lang;
  const exact = voices.filter((v) => v.lang.toLowerCase().replace("_", "-") === tag);
  const loose = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix) && !exact.includes(v));
  return [...exact, ...loose];
}

export function pickVoice(lang: Lang): SpeechSynthesisVoice | null {
  const s = getSettings();
  const chosen = lang === "vi" ? s.viVoiceURI : s.enVoiceURI;
  const list = voicesFor(lang);
  return list.find((v) => v.voiceURI === chosen) ?? list.find((v) => v.localService) ?? list[0] ?? null;
}

export function voiceStatus(lang: Lang): VoiceStatus {
  if (!isSupported()) return "unsupported";
  if (!voicesReady) return "loading";
  return voicesFor(lang).length ? "ok" : "missing";
}

export function cancelSpeech() {
  token++;
  if (isSupported()) window.speechSynthesis.cancel();
  if (speaking) {
    speaking = false;
    emit();
  }
}

/**
 * Speak segments in order. Any previous speech is cancelled first (no overlap).
 * Segments whose language has no installed voice are skipped (the UI shows text + an honest notice).
 * Resolves when finished or cancelled. Must be triggered after a user click at least once per page.
 */
export async function speak(segments: Segment[]): Promise<void> {
  cancelSpeech();
  if (!isSupported() || getSettings().muted) return;
  const my = ++token;
  if (!voicesReady) await loadVoices();
  if (my !== token) return;
  speaking = true;
  emit();
  for (const seg of segments) {
    if (my !== token) return;
    const voice = pickVoice(seg.lang);
    if (!voice) continue; // never pretend: no matching voice, no audio for this language
    await new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(seg.text);
      u.voice = voice;
      u.lang = voice.lang || LANG_TAG[seg.lang];
      u.rate = RATE[seg.lang];
      u.pitch = seg.lang === "en" ? 1.1 : 1.05;
      u.onend = () => resolve();
      u.onerror = () => resolve();
      // Safety net: some engines never fire onend.
      setTimeout(resolve, 2500 + seg.text.length * 120);
      window.speechSynthesis.speak(u);
    });
  }
  if (my === token) {
    speaking = false;
    emit();
  }
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function useSpeaking() {
  return useSyncExternalStore(subscribe, () => speaking, () => false);
}

export function useVoiceStatus() {
  const [, force] = useState(0);
  useEffect(() => {
    loadVoices().then(() => force((n) => n + 1));
    return subscribe(() => force((n) => n + 1));
  }, []);
  return { vi: voiceStatus("vi"), en: voiceStatus("en") };
}

export function useVoiceLists() {
  useVoiceStatus();
  return { vi: voicesFor("vi"), en: voicesFor("en") };
}
