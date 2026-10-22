import { afterEach, beforeEach, expect, it, vi } from "vitest";

function voice(name: string, lang = "en-US") {
  return { name, lang, voiceURI: name, localService: true, default: false } as SpeechSynthesisVoice;
}
let available: SpeechSynthesisVoice[];
let utterances: { text: string; voice: SpeechSynthesisVoice; lang: string }[];
const events = new EventTarget();
beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
  available = [voice("Microsoft David"), voice("Microsoft Zira"), voice("Vietnamese", "vi-VN")];
  utterances = [];
  vi.stubGlobal(
    "SpeechSynthesisUtterance",
    class {
      constructor(public text: string) {}
    },
  );
  vi.stubGlobal("speechSynthesis", {
    getVoices: () => available,
    cancel: vi.fn(),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    speak: (u: { text: string; voice: SpeechSynthesisVoice; lang: string; onend: () => void }) => {
      utterances.push(u);
      queueMicrotask(() => u.onend());
    },
  });
});
afterEach(() => vi.unstubAllGlobals());
it("chooses an installed female English voice ahead of a male default", async () => {
  const s = await import("@/lib/speech");
  await s.loadVoices();
  expect(s.pickVoice("en")?.name).toBe("Microsoft Zira");
  await s.speak([
    { text: "Xin chào", lang: "vi" },
    { text: "Hello!", lang: "en" },
  ]);
  expect(utterances.map((u) => u.text)).toEqual(["Hello!"]);
  expect(utterances[0]?.voice.name).toBe("Microsoft Zira");
});
it("reports missing English honestly and does not use Vietnamese as fallback", async () => {
  available = [voice("Vietnamese", "vi-VN")];
  const s = await import("@/lib/speech");
  await s.loadVoices();
  expect(s.voiceStatus("en")).toBe("missing");
  await s.speak([{ text: "Hello", lang: "en" }]);
  expect(utterances).toHaveLength(0);
});
it("uses the available English voice without claiming unknown gender", async () => {
  available = [voice("Device English")];
  const s = await import("@/lib/speech");
  await s.loadVoices();
  expect(s.isLikelyFemale(s.pickVoice("en")!)).toBe(false);
});
it("does not speak when muted", async () => {
  const settings = await import("@/lib/settings");
  settings.updateSettings({ muted: true });
  const s = await import("@/lib/speech");
  await s.speak([{ text: "Hello", lang: "en" }]);
  expect(utterances).toHaveLength(0);
});
