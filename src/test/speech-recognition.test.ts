import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  beginRecognition,
  childFriendlyMatch,
  recognitionAvailable,
} from "@/lib/speech-recognition";

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

it("matches a child's target word generously without treating arbitrary words as correct", () => {
  expect(childFriendlyMatch("sun", "sun")).toBe(true);
  expect(childFriendlyMatch("the son is bright", "sun")).toBe(true);
  expect(childFriendlyMatch("rabit", "rabbit")).toBe(true);
  expect(childFriendlyMatch("I see a green apple", "apple")).toBe(true);
  expect(childFriendlyMatch("cloud", "sun")).toBe(false);
  expect(childFriendlyMatch("dog", "elephant")).toBe(false);
});

it("only reports microphone recognition available when the browser exposes it", () => {
  vi.stubGlobal("window", {});
  expect(recognitionAvailable()).toBe(false);
  vi.stubGlobal("window", { webkitSpeechRecognition: class {} });
  expect(recognitionAvailable()).toBe(true);
});

it("passes only temporary recognition text and maps browser errors to recovery states", () => {
  class FakeRecognition {
    static latest: FakeRecognition | null = null;
    lang = "";
    continuous = false;
    interimResults = false;
    maxAlternatives = 1;
    onresult:
      ((event: { results: [[{ transcript: string }]]; resultIndex: number }) => void) | null = null;
    onerror: ((event: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    constructor() {
      FakeRecognition.latest = this;
    }
    start() {}
    stop() {}
    abort() {}
  }
  vi.stubGlobal("window", { SpeechRecognition: FakeRecognition });
  const heard: string[] = [];
  const errors: string[] = [];
  const recognition = beginRecognition({
    onResult: (text) => heard.push(text),
    onError: (status) => errors.push(status),
    onEnd: vi.fn(),
  });
  expect(recognition).not.toBeNull();
  const fake = FakeRecognition.latest!;
  expect(fake.lang).toBe("en-US");
  fake.onresult?.({ results: [[{ transcript: "sun" }]], resultIndex: 0 });
  fake.onerror?.({ error: "not-allowed" });
  fake.onerror?.({ error: "no-speech" });
  expect(heard).toEqual(["sun"]);
  expect(errors).toEqual(["denied", "no-speech"]);
});
