import { useEffect, useState } from "react";
import { WordArt } from "./WordArt";
import type { AdventureId } from "@/lib/content";

/**
 * The storybook garden. `bloom` (0..1) drives the transformation: grey & sleepy at 0,
 * saturated, flowering and alive at 1. `revealed` words appear in the scene.
 */
export function GardenScene({
  bloom,
  revealed = [],
  adventure = "garden",
  onTapWord,
  className = "",
}: {
  bloom: number;
  revealed?: string[];
  adventure?: AdventureId;
  onTapWord?: (id: string) => void;
  className?: string;
}) {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
    const f = () => setPortrait(mq.matches);
    f();
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);
  const sat = 0.25 + bloom * 0.85;
  const flowers = Math.round(bloom * 9);
  const pos: Record<string, { x: number; y: number; s: number }> = {
    sun: { x: 960, y: 40, s: 150 },
    rain: { x: 180, y: 50, s: 150 },
    rabbit: { x: 360, y: 220, s: 130 },
    apple: { x: 700, y: 200, s: 100 },
    red: { x: 220, y: 360, s: 110 },
    blue: { x: 440, y: 330, s: 110 },
    yellow: { x: 660, y: 350, s: 110 },
    green: { x: 880, y: 330, s: 110 },
    cat: { x: 300, y: 300, s: 110 },
    dog: { x: 470, y: 300, s: 110 },
    bird: { x: 640, y: 290, s: 110 },
    elephant: { x: 810, y: 280, s: 120 },
  };
  return (
    <svg
      viewBox="0 0 1200 560"
      preserveAspectRatio={portrait ? "xMidYMax meet" : "xMidYMax slice"}
      className={`garden-transition block h-full w-full ${className}`}
      style={{ filter: `saturate(${sat}) brightness(${0.92 + bloom * 0.1})` }}
      role="img"
      aria-label={bloom > 0.6 ? "Khu vườn rực rỡ đã thức dậy" : "Khu vườn đang ngủ"}
    >
      <defs>
        <linearGradient id="kv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--sky-deep)" />
          <stop offset="0.7" stopColor="var(--sky)" />
          <stop offset="1" stopColor="var(--cream)" />
        </linearGradient>
      </defs>
      {!portrait && <rect width="1200" height="560" fill="url(#kv-sky)" />}
      {/* clouds */}
      <g className="animate-drift" fill="var(--cream)" opacity=".9">
        <ellipse cx="420" cy="90" rx="70" ry="24" />
        <ellipse cx="460" cy="74" rx="44" ry="28" />
        <ellipse cx="760" cy="140" rx="60" ry="20" />
        <ellipse cx="790" cy="126" rx="36" ry="22" />
      </g>
      {/* hills */}
      <path d="M0 380 C200 300 380 300 560 360 C760 420 940 300 1200 340 L1200 560 L0 560Z" fill="var(--leaf)" />
      <path d="M0 450 C220 380 460 400 640 440 C840 480 1000 400 1200 430 L1200 560 L0 560Z" fill="var(--leaf-deep)" opacity=".85" />
      {/* tree */}
      <rect x="1040" y="250" width="26" height="140" rx="10" fill="var(--bark)" />
      <circle cx="1053" cy="230" r={70 + bloom * 12} fill="var(--paint-green)" className="garden-transition" />
      {bloom > 0.5 && (
        <g fill="var(--paint-red)" className="animate-pop">
          <circle cx="1020" cy="220" r="10" /><circle cx="1080" cy="200" r="10" /><circle cx="1060" cy="260" r="10" />
        </g>
      )}
      {/* flowers grow with bloom */}
      {Array.from({ length: flowers }).map((_, i) => {
        const x = 80 + i * 120;
        const y = 470 + (i % 2) * 30;
        const c = ["var(--paint-red)", "var(--paint-yellow)", "var(--coral)", "var(--paint-blue)"][i % 4];
        return (
          <g key={i} className="animate-pop" style={{ animationDelay: `${i * 80}ms` }}>
            <line x1={x} y1={y} x2={x} y2={y + 40} stroke="var(--leaf-deep)" strokeWidth="5" />
            {[0, 72, 144, 216, 288].map((a) => (
              <circle key={a} cx={x + Math.cos((a * Math.PI) / 180) * 12} cy={y + Math.sin((a * Math.PI) / 180) * 12} r="10" fill={c} />
            ))}
            <circle cx={x} cy={y} r="8" fill="var(--sun)" />
          </g>
        );
      })}
      {/* train track for train adventure */}
      {adventure === "train" && (
        <g>
          <rect x="180" y="410" width="900" height="10" rx="5" fill="var(--bark)" />
          <g fill="var(--coral-deep)">
            <rect x="900" y="300" width="160" height="110" rx="20" />
            <rect x="1000" y="250" width="40" height="60" rx="8" />
          </g>
          <circle cx="940" cy="415" r="22" fill="var(--ink)" /><circle cx="1020" cy="415" r="22" fill="var(--ink)" />
          {[260, 430, 600, 770].map((x) => (
            <g key={x}>
              <rect x={x - 10} y="380" width="150" height="30" rx="10" fill="var(--sun-deep)" />
              <circle cx={x + 20} cy="415" r="14" fill="var(--ink)" /><circle cx={x + 110} cy="415" r="14" fill="var(--ink)" />
            </g>
          ))}
        </g>
      )}
      {/* rain falls when revealed */}
      {revealed.includes("rain") && (
        <g fill="var(--paint-blue)">
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x={170 + i * 16} y={200} width="4" height="14" rx="2" className="animate-rain" style={{ animationDelay: `${i * 110}ms` }} />
          ))}
        </g>
      )}
      {/* revealed words */}
      {revealed.map((id) => {
        const p = pos[id];
        if (!p) return null;
        return (
          <g
            key={id}
            className="animate-pop"
            style={{ cursor: onTapWord ? "pointer" : undefined }}
            onClick={onTapWord ? () => onTapWord(id) : undefined}
          >
            <WordArt id={id} x={p.x} y={p.y} size={p.s} />
          </g>
        );
      })}
    </svg>
  );
}
