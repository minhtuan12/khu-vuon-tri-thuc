// "Mầm" — original seed-sprout mascot of Khu Vườn Tri Thức.
export type Mood = "happy" | "think" | "cheer" | "sleepy";

export function Mascot({ mood = "happy", talking = false, className }: { mood?: Mood; talking?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 160 180" className={className} role="img" aria-label="Bạn Mầm">
      {/* sprout */}
      <path d="M80 50 Q78 30 82 14" stroke="var(--leaf-deep)" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M82 22 C96 2 126 6 128 22 C112 34 92 34 82 22Z" fill="var(--paint-green)" />
      <path d="M80 30 C66 12 40 16 38 30 C52 40 72 40 80 30Z" fill="var(--leaf)" />
      {/* body */}
      <ellipse cx="80" cy="112" rx="58" ry="62" fill="var(--sun)" />
      <ellipse cx="80" cy="128" rx="40" ry="38" fill="var(--cream)" opacity=".7" />
      {/* arms */}
      {mood === "cheer" ? (
        <>
          <path d="M26 104 Q8 80 16 62" stroke="var(--sun-deep)" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M134 104 Q152 80 144 62" stroke="var(--sun-deep)" strokeWidth="12" fill="none" strokeLinecap="round" />
        </>
      ) : (
        <>
          <path d="M26 112 Q10 124 18 140" stroke="var(--sun-deep)" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M134 112 Q150 124 142 140" stroke="var(--sun-deep)" strokeWidth="12" fill="none" strokeLinecap="round" />
        </>
      )}
      {/* face */}
      {mood === "sleepy" ? (
        <g stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M52 94 q8 6 16 0" />
          <path d="M92 94 q8 6 16 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="60" cy="92" rx="9" ry={mood === "think" ? 8 : 11} fill="var(--ink)" />
          <ellipse cx="100" cy="92" rx="9" ry={mood === "think" ? 8 : 11} fill="var(--ink)" />
          <circle cx="63" cy="88" r="3.4" fill="var(--cream)" />
          <circle cx="103" cy="88" r="3.4" fill="var(--cream)" />
        </g>
      )}
      <circle cx="44" cy="110" r="8" fill="var(--coral)" opacity=".75" />
      <circle cx="116" cy="110" r="8" fill="var(--coral)" opacity=".75" />
      {talking ? (
        <ellipse cx="80" cy="116" rx="9" ry="8" fill="var(--coral-deep)" className="animate-talk" />
      ) : mood === "think" ? (
        <path d="M70 116 h20" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      ) : (
        <path d="M66 110 Q80 128 94 110" stroke="var(--ink)" strokeWidth="4.5" fill={mood === "cheer" ? "var(--coral-deep)" : "none"} strokeLinecap="round" />
      )}
      {/* feet */}
      <ellipse cx="58" cy="172" rx="16" ry="7" fill="var(--sun-deep)" />
      <ellipse cx="102" cy="172" rx="16" ry="7" fill="var(--sun-deep)" />
    </svg>
  );
}
