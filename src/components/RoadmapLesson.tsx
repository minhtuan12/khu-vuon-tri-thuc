import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Ear, Mic, MicOff, RotateCcw, Volume2 } from "lucide-react";
import { optionsForAge, roadmapKey, type Adventure, type AgeBand, type Word } from "@/lib/content";
import { getProgress, recordActivity, recordProgress } from "@/lib/progress";
import {
  cancelSpeech,
  isLikelyFemale,
  pickVoice,
  speak,
  useSpeaking,
  useVoiceStatus,
} from "@/lib/speech";
import { useSettings } from "@/lib/settings";
import { BigButton } from "./kit";
import { Mascot } from "./Mascot";
import { WordArt } from "./WordArt";
import { SoundToggle } from "./TopBar";
import {
  beginRecognition,
  childFriendlyMatch,
  recognitionAvailable,
  type BrowserRecognition,
  type RecognitionStatus,
} from "@/lib/speech-recognition";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const STEPS = ["Hello", "Listen", "Say it", "Choose", "Say more", "Hooray!"];

export function RoadmapLesson({
  adventure,
  word,
  age,
  onDone,
}: {
  adventure: Adventure;
  word: Word;
  age: AgeBand;
  onDone: () => void;
}) {
  const experienceId = roadmapKey(word.id);
  const [stage, setStage] = useState(() => {
    const saved = getProgress(adventure.id, experienceId);
    return saved && !saved.completed ? saved.stage : 0;
  });
  const [tries, setTries] = useState(0);
  const [answer, setAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [started, setStarted] = useState(false);
  const [micConsent, setMicConsent] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [recognitionStatus, setRecognitionStatus] = useState<RecognitionStatus>("idle");
  const [heard, setHeard] = useState("");
  const recognition = useRef<BrowserRecognition | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const voice = useVoiceStatus();
  const speaking = useSpeaking();
  const settings = useSettings();
  const options = optionsForAge(age);
  const candidates = [word, ...adventure.words.filter((w) => w.id !== word.id)].slice(0, options);
  const offset = (adventure.words.indexOf(word) + 1) % options;
  const choices = candidates.map((_, i) => candidates[(i + offset) % options]!);
  const correct = answer === word.id;
  const text = [
    `Hello! Let's meet ${word.en}!`,
    `Listen carefully. ${word.en}. ${word.en}.`,
    `Your turn! Say ${word.en}.`,
    `Listen and choose. ${word.en}.`,
    `Say it with me! ${word.sentence}`,
    `Hooray! You practised ${word.en}. Thank you for playing!`,
  ][stage]!;
  const titles = [
    "Hello, little explorer!",
    "Listen with Mầm",
    "Your turn to speak!",
    "Which one did you hear?",
    "Let's say a little more!",
    "You made a flower bloom!",
  ];
  useEffect(
    () => () => {
      cancelSpeech();
      recognition.current?.abort();
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (started) void speak([{ text, lang: "en" }]);
    heading.current?.focus({ preventScroll: true });
  }, [stage, started, text]);

  function go(next: number) {
    cancelSpeech();
    recognition.current?.abort();
    recognition.current = null;
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setStarted(true);
    setStage(next);
    setFeedback("");
    setAnswer(null);
    setTries(0);
    setHeard("");
    setRecognitionStatus("idle");
    recordProgress(
      adventure.id,
      { stage: next, wordsSeen: [word.id], completed: next === 5 },
      experienceId,
    );
    if (next === 5)
      recordActivity({
        adventureId: adventure.id,
        experienceId,
        kind: "complete",
        wordId: word.id,
      });
  }
  function choose(id: string) {
    if (correct) return;
    setAnswer(id);
    recordActivity({
      adventureId: adventure.id,
      experienceId,
      kind: "attempt",
      wordId: word.id,
      correct: id === word.id,
    });
    if (id === word.id) {
      setFeedback("That's it! Wonderful listening!");
      void speak([{ text: `That's it! ${word.en}. Wonderful listening!`, lang: "en" }]);
    } else {
      const attempts = tries + 1;
      setTries(attempts);
      setFeedback(
        attempts >= 2
          ? "Here is a little hint. Try the glowing picture!"
          : "Let's try again. Listen one more time!",
      );
      if (attempts === 2)
        recordActivity({ adventureId: adventure.id, experienceId, kind: "hint", wordId: word.id });
      void speak([{ text: `Let's try again. Find ${word.en}.`, lang: "en" }]);
    }
  }
  function continueLesson() {
    if (stage === 1)
      recordActivity({ adventureId: adventure.id, experienceId, kind: "seen", wordId: word.id });
    go(stage + 1);
  }

  const speakingStage = stage === 2 || stage === 4;
  function finishSpeaking(transcript: string) {
    setHeard(transcript);
    setRecognitionStatus("idle");
    recognition.current = null;
    const passed = childFriendlyMatch(transcript, word.en);
    recordActivity({
      adventureId: adventure.id,
      experienceId,
      kind: "practice",
      wordId: word.id,
      correct: passed,
    });
    if (passed) {
      setFeedback("Wonderful! You said it! Let’s go to the next one.");
      void speak([{ text: `Wonderful! You said ${word.en}!`, lang: "en" }]);
      advanceTimer.current = setTimeout(() => go(stage + 1), 1100);
    } else {
      const attempts = tries + 1;
      setTries(attempts);
      setFeedback("Try again! Mầm knows you can do it.");
      void speak([{ text: "Try again! You can do it!", lang: "en" }]);
      if (attempts >= 2)
        recordActivity({ adventureId: adventure.id, experienceId, kind: "hint", wordId: word.id });
    }
  }
  function startListening() {
    if (!recognitionAvailable()) {
      setRecognitionStatus("unsupported");
      return;
    }
    cancelSpeech();
    setFeedback("");
    setHeard("");
    setRecognitionStatus("listening");
    try {
      recognition.current = beginRecognition({
        onResult: finishSpeaking,
        onError: (status) => {
          recognition.current = null;
          setRecognitionStatus(status);
          const message =
            status === "denied"
              ? "Microphone permission was not allowed. Ask a grown-up, then try again."
              : status === "no-speech"
                ? "I didn’t hear a voice. Try again when you are ready."
                : status === "network"
                  ? "Listening needs your browser’s speech service right now. Please try again."
                  : "Something stopped listening. Please try again.";
          setFeedback(message);
        },
        onEnd: () =>
          setRecognitionStatus((current) => (current === "listening" ? "idle" : current)),
      });
    } catch {
      setRecognitionStatus("error");
      setFeedback("Something stopped listening. Please try again.");
    }
  }

  return (
    <div className="path-lesson" lang="en">
      <div className="path-lesson__toolbar">
        <ol className="path-lesson__steps" aria-label="Lesson steps">
          {STEPS.map((name, i) => (
            <li
              key={name}
              aria-current={stage === i ? "step" : undefined}
              className={i <= stage ? "is-reached" : ""}
            >
              <span>{i < stage ? <Check size={14} aria-hidden /> : i + 1}</span>
              <small>{name}</small>
            </li>
          ))}
        </ol>
        <SoundToggle />
      </div>
      <div className="path-lesson__voice" role="status">
        {settings.muted
          ? "Sound is off. Turn it on to listen, or read along."
          : voice.en === "loading"
            ? "Finding your English voice…"
            : voice.en !== "ok"
              ? "No English voice is available. Read along with a grown-up, or install an English voice in your device settings."
              : !isLikelyFemale(pickVoice("en")!)
                ? "A female voice could not be identified. Using the available English voice; a grown-up can choose one in Settings."
                : "English voice · Listen, then speak at your own pace"}
      </div>
      <div className="path-lesson__heading">
        <Mascot
          mood={stage === 5 || correct ? "cheer" : speakingStage && tries > 0 ? "sad" : "happy"}
          talking={speaking}
          className="path-lesson__mascot"
        />
        <div>
          <span className="path-eyebrow">
            {STEPS[stage]} · {stage + 1}/6
          </span>
          <h2 ref={heading} tabIndex={-1}>
            {titles[stage]}
          </h2>
        </div>
      </div>
      {stage === 3 ? (
        <div
          className="path-lesson__choices"
          style={{ gridTemplateColumns: `repeat(${options === 2 ? 2 : options}, minmax(0, 1fr))` }}
        >
          {choices.map((w) => (
            <button
              key={w.id}
              className={`path-choice ${tries >= 2 && w.id === word.id ? "is-hint" : ""} ${answer === w.id ? (correct ? "is-correct" : "is-retry") : ""}`}
              aria-label={`Choose ${w.en}`}
              disabled={correct}
              onClick={() => choose(w.id)}
            >
              <WordArt id={w.id} />
              <span>{w.en}</span>
              {correct && w.id === word.id && <Check aria-hidden />}
            </button>
          ))}
        </div>
      ) : (
        <div className={`path-lesson__word ${stage === 5 ? "is-celebration" : ""}`}>
          <div className="path-lesson__picture">
            <WordArt id={word.id} />
          </div>
          <strong>{stage === 4 ? word.sentence : word.en}</strong>
          <p>
            {stage === 2 || stage === 4
              ? "Listen. Take your time. Say it out loud!"
              : stage === 5
                ? "A little practice, a lovely new discovery."
                : "A new friend for your English garden."}
          </p>
          {speakingStage && (
            <small>
              Your voice is checked only for this turn. No audio or transcript is saved.
            </small>
          )}
        </div>
      )}
      <p className="path-lesson__feedback" role="status">
        {feedback ||
          (stage === 3
            ? "Tap the picture that matches the word."
            : heard
              ? `We heard: “${heard}”`
              : " ")}
      </p>
      <div className="path-lesson__actions">
        <BigButton variant="paper" onClick={() => void speak([{ text, lang: "en" }])}>
          <Volume2 aria-hidden /> Listen again
        </BigButton>
        {stage === 5 ? (
          <BigButton onClick={onDone}>
            Back to my path <ArrowRight aria-hidden />
          </BigButton>
        ) : speakingStage ? (
          <>
            {recognitionStatus === "listening" ? (
              <BigButton variant="paper" onClick={() => recognition.current?.stop()}>
                <MicOff aria-hidden /> Listening… tap to stop
              </BigButton>
            ) : (
              <BigButton onClick={() => (micConsent ? startListening() : setConsentOpen(true))}>
                <Mic aria-hidden /> Try saying it
              </BigButton>
            )}
            {recognitionStatus === "unsupported" && (
              <button className="path-text-button" onClick={() => go(stage + 1)}>
                Continue without microphone
              </button>
            )}
            {(recognitionStatus === "denied" ||
              recognitionStatus === "network" ||
              recognitionStatus === "error") && (
              <button className="path-text-button" onClick={() => go(stage + 1)}>
                Continue without microphone
              </button>
            )}
          </>
        ) : (
          <BigButton onClick={continueLesson} disabled={stage === 3 && !correct}>
            {stage === 0 ? (
              <>
                <Ear aria-hidden /> Let's begin!
              </>
            ) : (
              <>
                Continue <ArrowRight aria-hidden />
              </>
            )}
          </BigButton>
        )}
        {stage > 0 && (
          <button className="path-text-button" onClick={() => go(0)}>
            <RotateCcw size={16} aria-hidden /> Start again
          </button>
        )}
      </div>
      <AlertDialog open={consentOpen} onOpenChange={setConsentOpen}>
        <AlertDialogContent className="max-w-md rounded-4xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Mic aria-hidden /> Grown-up permission
            </AlertDialogTitle>
            <AlertDialogDescription>
              This turn uses your browser’s English speech recognition. The app does not save audio
              or the words it hears. Some browsers send speech to their recognition service, so an
              adult should choose whether to continue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setMicConsent(true);
                setConsentOpen(false);
                setTimeout(startListening, 0);
              }}
            >
              Turn on microphone
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
