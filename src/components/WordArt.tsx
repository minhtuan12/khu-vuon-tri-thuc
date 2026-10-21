// Original hand-built SVG illustrations for every curated word. Colors come from design tokens.
const INK = "var(--ink)";

function Eyes({ y = 45, x1 = 40, x2 = 60 }: { y?: number; x1?: number; x2?: number }) {
  return (
    <g fill={INK}>
      <circle cx={x1} cy={y} r="3.4" />
      <circle cx={x2} cy={y} r="3.4" />
    </g>
  );
}
function Smile({ y = 55, w = 8 }: { y?: number; w?: number }) {
  return <path d={`M${50 - w} ${y} Q50 ${y + w * 0.8} ${50 + w} ${y}`} stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />;
}

const ART: Record<string, () => React.ReactElement> = {
  sun: () => (
    <g>
      <g stroke="var(--sun-deep)" strokeWidth="6" strokeLinecap="round">
        {Array.from({ length: 8 }).map((_, i) => {
          const a = (i * Math.PI) / 4;
          return <line key={i} x1={50 + Math.cos(a) * 32} y1={50 + Math.sin(a) * 32} x2={50 + Math.cos(a) * 44} y2={50 + Math.sin(a) * 44} />;
        })}
      </g>
      <circle cx="50" cy="50" r="25" fill="var(--paint-yellow)" />
      <circle cx="39" cy="56" r="4" fill="var(--coral)" opacity=".7" />
      <circle cx="61" cy="56" r="4" fill="var(--coral)" opacity=".7" />
      <Eyes y={47} x1={42} x2={58} />
      <Smile y={55} w={6} />
    </g>
  ),
  rain: () => (
    <g>
      <path d="M22 52 a16 16 0 0 1 12-24 a20 20 0 0 1 36 2 a14 14 0 0 1 8 26 Z" fill="var(--elephant)" />
      <Eyes y={42} x1={42} x2={58} />
      <Smile y={48} w={5} />
      <g fill="var(--paint-blue)">
        <path d="M32 64 q4 8 0 12 q-4-4 0-12z" />
        <path d="M50 66 q4 8 0 12 q-4-4 0-12z" />
        <path d="M68 64 q4 8 0 12 q-4-4 0-12z" />
        <path d="M41 80 q3 6 0 9 q-3-3 0-9z" />
        <path d="M59 80 q3 6 0 9 q-3-3 0-9z" />
      </g>
    </g>
  ),
  rabbit: () => (
    <g>
      <ellipse cx="38" cy="26" rx="8" ry="20" fill="var(--fur)" stroke="var(--fur-warm)" strokeWidth="2" />
      <ellipse cx="62" cy="26" rx="8" ry="20" fill="var(--fur)" stroke="var(--fur-warm)" strokeWidth="2" />
      <ellipse cx="38" cy="28" rx="3.5" ry="13" fill="var(--coral)" />
      <ellipse cx="62" cy="28" rx="3.5" ry="13" fill="var(--coral)" />
      <ellipse cx="50" cy="72" rx="24" ry="20" fill="var(--fur)" stroke="var(--fur-warm)" strokeWidth="2" />
      <circle cx="50" cy="52" r="20" fill="var(--fur)" stroke="var(--fur-warm)" strokeWidth="2" />
      <Eyes y={50} x1={43} x2={57} />
      <ellipse cx="50" cy="57" rx="3" ry="2" fill="var(--coral-deep)" />
      <path d="M46 61 q4 4 8 0" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  apple: () => (
    <g>
      <path d="M50 30 q-2-12 6-18" stroke="var(--bark)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M54 20 q14-8 20 4 q-12 6-20-4z" fill="var(--paint-green)" />
      <path d="M50 34 C30 22 12 40 18 62 C24 84 40 90 50 84 C60 90 76 84 82 62 C88 40 70 22 50 34Z" fill="var(--paint-red)" />
      <ellipse cx="34" cy="48" rx="6" ry="9" fill="oklch(1 0 0 / 0.35)" />
      <Eyes y={58} x1={42} x2={58} />
      <Smile y={66} w={6} />
    </g>
  ),
  red: () => <Paint color="var(--paint-red)" />,
  blue: () => <Paint color="var(--paint-blue)" />,
  yellow: () => <Paint color="var(--paint-yellow)" />,
  green: () => <Paint color="var(--paint-green)" />,
  cat: () => (
    <g>
      <path d="M26 40 L30 14 L46 30Z M74 40 L70 14 L54 30Z" fill="var(--sun-deep)" />
      <path d="M31 22 L33 34 L40 30Z M69 22 L67 34 L60 30Z" fill="var(--coral)" />
      <ellipse cx="50" cy="56" rx="30" ry="27" fill="var(--sun-deep)" />
      <path d="M40 34 q4 6 0 10 M50 31 v10 M60 34 q-4 6 0 10" stroke="var(--bark)" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity=".6" />
      <Eyes y={54} x1={39} x2={61} />
      <path d="M47 62 l3 3 l3 -3z" fill="var(--coral-deep)" />
      <path d="M44 68 q6 5 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <g stroke={INK} strokeWidth="1.6" strokeLinecap="round">
        <line x1="16" y1="60" x2="32" y2="62" /><line x1="16" y1="68" x2="32" y2="66" />
        <line x1="84" y1="60" x2="68" y2="62" /><line x1="84" y1="68" x2="68" y2="66" />
      </g>
    </g>
  ),
  dog: () => (
    <g>
      <ellipse cx="50" cy="54" rx="28" ry="28" fill="var(--fur-warm)" />
      <path d="M24 34 q-14 4 -10 30 q10 4 16 -8z" fill="var(--bark)" />
      <path d="M76 34 q14 4 10 30 q-10 4 -16 -8z" fill="var(--bark)" />
      <ellipse cx="50" cy="66" rx="16" ry="12" fill="var(--fur)" />
      <Eyes y={48} x1={40} x2={60} />
      <ellipse cx="50" cy="60" rx="6" ry="4.5" fill={INK} />
      <path d="M44 68 q6 6 12 0" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d="M50 70 q0 10 6 8 q2-6 -2-8" fill="var(--coral-deep)" />
    </g>
  ),
  bird: () => (
    <g>
      <ellipse cx="48" cy="56" rx="28" ry="24" fill="var(--paint-blue)" />
      <path d="M40 54 q14 -6 22 10 q-14 8 -22 -10z" fill="var(--sky-deep)" />
      <circle cx="60" cy="38" r="16" fill="var(--paint-blue)" />
      <path d="M54 22 q4 -10 10 -4 q-4 0 -4 6" fill="var(--sky-deep)" />
      <circle cx="64" cy="36" r="3.4" fill={INK} />
      <path d="M74 38 l12 4 l-12 4z" fill="var(--sun-deep)" />
      <path d="M22 54 l-12 -8 l2 16z" fill="var(--sky-deep)" />
      <g stroke="var(--sun-deep)" strokeWidth="3" strokeLinecap="round"><line x1="42" y1="80" x2="40" y2="90" /><line x1="54" y1="80" x2="56" y2="90" /></g>
    </g>
  ),
  elephant: () => (
    <g>
      <ellipse cx="24" cy="46" rx="18" ry="22" fill="var(--elephant)" />
      <ellipse cx="76" cy="46" rx="18" ry="22" fill="var(--elephant)" />
      <ellipse cx="24" cy="46" rx="10" ry="14" fill="var(--coral)" opacity=".6" />
      <ellipse cx="76" cy="46" rx="10" ry="14" fill="var(--coral)" opacity=".6" />
      <circle cx="50" cy="46" r="26" fill="var(--elephant)" />
      <path d="M44 58 q-2 22 10 30 q8 2 6 -6 q-8 -4 -6 -24z" fill="var(--elephant)" />
      <Eyes y={42} x1={40} x2={60} />
      <circle cx="36" cy="52" r="3.5" fill="var(--coral)" opacity=".7" />
      <circle cx="64" cy="52" r="3.5" fill="var(--coral)" opacity=".7" />
    </g>
  ),
};

function Paint({ color }: { color: string }) {
  return (
    <g>
      <path d="M50 12 C70 12 88 26 88 46 C88 58 78 62 70 60 C62 58 58 64 62 72 C66 82 60 90 48 88 C26 86 12 70 12 50 C12 28 30 12 50 12Z" fill="var(--fur)" stroke="var(--fur-warm)" strokeWidth="2" />
      <circle cx="50" cy="40" r="14" fill={color} />
      <circle cx="32" cy="54" r="9" fill={color} opacity=".85" />
      <circle cx="36" cy="74" r="7" fill={color} opacity=".7" />
      <circle cx="50" cy="38" r="3" fill={INK} opacity=".0" />
    </g>
  );
}

export function WordArt({ id, className, title, x, y, size }: { id: string; className?: string; title?: string; x?: number; y?: number; size?: number }) {
  const Art = ART[id];
  return (
    <svg viewBox="0 0 100 100" className={className} {...(size !== undefined ? { x, y, width: size, height: size } : {})} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {Art ? <Art /> : null}
    </svg>
  );
}
