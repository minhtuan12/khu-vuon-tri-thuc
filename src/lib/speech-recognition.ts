// Browser-owned speech recognition. Audio is never recorded, persisted or sent by this app.
// Some browsers may use their own online recognition service; the adult consent copy says so.
export type RecognitionStatus =
  | "unsupported"
  | "idle"
  | "listening"
  | "processing"
  | "denied"
  | "no-speech"
  | "network"
  | "error";

type RecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
  resultIndex: number;
};
type RecognitionErrorEvent = { error: string };
export interface BrowserRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionConstructor = new () => BrowserRecognition;

function getConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const source = window as Window & {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return source.SpeechRecognition ?? source.webkitSpeechRecognition ?? null;
}

export function recognitionAvailable() {
  return !!getConstructor();
}

const aliases: Record<string, string[]> = {
  sun: ["son", "sung"],
  rain: ["reign", "rane"],
  rabbit: ["rabit"],
  apple: ["appel"],
  blue: ["blew"],
  yellow: ["yello"],
  green: ["grean"],
  cat: ["kat"],
  dog: ["dawg"],
  bird: ["burd"],
  elephant: ["elefant"],
};

export function normalizeSpeech(value: string) {
  return value
    .toLocaleLowerCase("en-US")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function editDistance(a: string, b: string) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0]!;
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const next = row[j]!;
      row[j] = Math.min(row[j]! + 1, row[j - 1]! + 1, previous + Number(a[i - 1] !== b[j - 1]));
      previous = next;
    }
  }
  return row[b.length]!;
}

/**
 * Deliberately generous for young learners: target/known sound-alike anywhere
 * in the phrase, or up to half the letters different for an individual word.
 * This is encouraging feedback, never an assessment of pronunciation.
 */
export function childFriendlyMatch(transcript: string, target: string) {
  const heard = normalizeSpeech(transcript);
  const expected = normalizeSpeech(target);
  if (!heard || !expected) return false;
  const tokens = heard.split(" ");
  if (tokens.includes(expected) || aliases[expected]?.some((a) => tokens.includes(a))) return true;
  const allowed = Math.max(1, Math.ceil(expected.length * 0.5));
  return tokens.some(
    (token) =>
      Math.abs(token.length - expected.length) <= allowed &&
      editDistance(token, expected) <= allowed,
  );
}

export function beginRecognition({
  onResult,
  onError,
  onEnd,
}: {
  onResult: (transcript: string) => void;
  onError: (
    status: Exclude<RecognitionStatus, "idle" | "listening" | "processing" | "unsupported">,
  ) => void;
  onEnd: () => void;
}): BrowserRecognition | null {
  const Constructor = getConstructor();
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.lang = "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const result = event.results[event.resultIndex] ?? event.results[0];
    onResult(result?.[0]?.transcript ?? "");
  };
  recognition.onerror = (event) => {
    const status =
      event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "denied"
        : event.error === "no-speech"
          ? "no-speech"
          : event.error === "network"
            ? "network"
            : "error";
    onError(status);
  };
  recognition.onend = onEnd;
  recognition.start();
  return recognition;
}
