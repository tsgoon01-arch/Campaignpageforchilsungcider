import { motion } from 'motion/react';
import chilsungLogo from 'figma:asset/08d441681e4b572c719575a05a82eb624321bfac.png';

const GREEN = '#2BAE4E';
const DARK_GREEN = '#1A8035';
const YELLOW = '#FFD740';
const CREAM = '#FFFBE6';

// ── Gimbap cross-section (세워진 컷) ───────────────────────────────────────────
function GimbapPiece({
  x, y, r = 44, rotate = 0, scale = 1,
}: {
  x: number; y: number; r?: number; rotate?: number; scale?: number;
}) {
  return (
    <g transform={`translate(${x},${y}) rotate(${rotate}) scale(${scale})`}>
      {/* Seaweed outer */}
      <circle cx={0} cy={0} r={r} fill="#1A1A10" />
      {/* Rice layer */}
      <circle cx={0} cy={0} r={r - 5} fill="#FFFFF0" />
      {/* Fillings */}
      <circle cx={0} cy={0} r={r - 14} fill="#FFF3CD" />
      {/* Spinach */}
      <ellipse cx={-14} cy={-6} rx={7} ry={5} fill="#3D9A3A" opacity={0.9} />
      {/* Carrot */}
      <ellipse cx={10} cy={-10} rx={5} ry={4} fill="#FF8C42" opacity={0.9} />
      {/* Burdock (우엉) */}
      <ellipse cx={14} cy={8} rx={5} ry={4} fill="#8B5E3C" opacity={0.85} />
      {/* Egg */}
      <ellipse cx={-8} cy={10} rx={6} ry={5} fill="#FFD166" opacity={0.9} />
      {/* Crab/Tuna center */}
      <circle cx={1} cy={0} r={8} fill="#FFA07A" opacity={0.75} />
      {/* Sesame seeds on seaweed */}
      {[0, 60, 120, 180, 240, 300].map((a) => {
        const rad = (a * Math.PI) / 180;
        const sx = Math.cos(rad) * (r - 2.5);
        const sy = Math.sin(rad) * (r - 2.5);
        return <circle key={a} cx={sx} cy={sy} r={1.2} fill="#FFFDE7" opacity={0.6} />;
      })}
    </g>
  );
}

// ── Chilsung Can body ──────────────────────────────────────────────────────────
function ChilsungCan({ x, y }: { x: number; y: number }) {
  const cw = 90;
  const ch = 170;
  const rx = cw / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Shadow */}
      <ellipse cx={0} cy={ch / 2 + 10} rx={rx + 10} ry={10} fill="rgba(0,0,0,0.13)" />

      {/* Can body */}
      <rect x={-rx} y={-ch / 2} width={cw} height={ch} rx={8} fill={DARK_GREEN} />

      <defs>
        <linearGradient id="canGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1A8035" />
          <stop offset="35%" stopColor="#2BAE4E" />
          <stop offset="65%" stopColor="#2BAE4E" />
          <stop offset="100%" stopColor="#145c28" />
        </linearGradient>
        <linearGradient id="canShine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="30%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <clipPath id="canClip">
          <rect x={-rx} y={-ch / 2} width={cw} height={ch} rx={8} />
        </clipPath>
      </defs>

      {/* Body gradient */}
      <rect x={-rx} y={-ch / 2} width={cw} height={ch} rx={8} fill="url(#canGrad)" />

      {/* White band top */}
      <rect x={-rx} y={-ch / 2} width={cw} height={22} rx={4} fill="white" clipPath="url(#canClip)" />
      {/* White band bottom */}
      <rect x={-rx} y={ch / 2 - 22} width={cw} height={22} rx={4} fill="white" clipPath="url(#canClip)" />

      {/* Logo image on can front — embedded via foreignObject */}
      <image
        href={chilsungLogo}
        x={-rx + 4}
        y={-ch / 2 + 25}
        width={cw - 8}
        height={(cw - 8) * 0.525}
        preserveAspectRatio="xMidYMid meet"
        clipPath="url(#canClip)"
        style={{ borderRadius: '4px' }}
      />

      {/* Star icons on can sides */}
      {[-48, -16, 16, 48].map((dy, i) => (
        <text key={i} x={28} y={dy} fontSize={10} fill={YELLOW} opacity={0.85} textAnchor="middle" dominantBaseline="middle">★</text>
      ))}
      {[-48, -16, 16, 48].map((dy, i) => (
        <text key={i} x={-28} y={dy} fontSize={10} fill={YELLOW} opacity={0.85} textAnchor="middle" dominantBaseline="middle">★</text>
      ))}

      {/* Shine overlay */}
      <rect x={-rx} y={-ch / 2} width={cw} height={ch} rx={8} fill="url(#canShine)" />

      {/* Top rim */}
      <ellipse cx={0} cy={-ch / 2} rx={rx} ry={7} fill="#C0C0C0" />
      <ellipse cx={0} cy={-ch / 2} rx={rx - 4} ry={4} fill="#D8D8D8" />
      {/* Pull tab */}
      <ellipse cx={8} cy={-ch / 2 - 3} rx={7} ry={3} fill="#B0B0B0" />
      <rect x={4} y={-ch / 2 - 6} width={8} height={4} rx={1} fill="#A0A0A0" />

      {/* Bottom rim */}
      <ellipse cx={0} cy={ch / 2} rx={rx} ry={7} fill="#B8B8B8" />
      <ellipse cx={0} cy={ch / 2} rx={rx - 6} ry={4} fill="#C8C8C8" />
    </g>
  );
}

// ── Sparkle ────────────────────────────────────────────────────────────────────
function Sparkle({ x, y, size = 16, color = YELLOW, delay = 0 }: {
  x: number; y: number; size?: number; color?: string; delay?: number;
}) {
  return (
    <motion.g transform={`translate(${x},${y})`}
      animate={{ scale: [0.7, 1.2, 0.7], opacity: [0.5, 1, 0.5], rotate: [0, 20, 0] }}
      transition={{ duration: 2.2, repeat: Infinity, delay, ease: 'easeInOut' }}>
      <polygon points={`0,${-size} ${size * 0.25},${-size * 0.25} ${size},0 ${size * 0.25},${size * 0.25} 0,${size} ${-size * 0.25},${size * 0.25} ${-size},0 ${-size * 0.25},${-size * 0.25}`}
        fill={color} />
    </motion.g>
  );
}

// ── Bubble / speech ───────────────────────────────────────────────────────────
function SpeechBubble({ x, y, text, bg = YELLOW, textColor = '#1A1A1A' }: {
  x: number; y: number; text: string; bg?: string; textColor?: string;
}) {
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-36} y={-18} width={72} height={32} rx={10} fill={bg} stroke="#1A1A1A" strokeWidth={2.5} />
      <polygon points="0,14 -8,22 8,22" fill={bg} stroke="#1A1A1A" strokeWidth={2} strokeLinejoin="round" />
      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={900}
        fill={textColor} fontFamily="'Black Han Sans', 'Noto Sans KR', sans-serif">{text}</text>
    </g>
  );
}

// ── Wavy lines (background texture) ──────────────────────────────────────────
function WavyBg() {
  return (
    <g opacity={0.06}>
      {[...Array(10)].map((_, i) => (
        <path key={i}
          d={`M -20 ${i * 28 - 30} Q 80 ${i * 28 - 15} 180 ${i * 28 - 30} Q 280 ${i * 28 - 45} 380 ${i * 28 - 30}`}
          fill="none" stroke={GREEN} strokeWidth={2} />
      ))}
    </g>
  );
}

// ── Main Illustration ─────────────────────────────────────────────────────────
export function KitschHeroIllustration() {
  const W = 420;
  const H = 340;

  return (
    <div style={{ width: '100%', maxWidth: '460px', margin: '0 auto', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
        aria-label="김밥엔 사이다 — 칠성사이다 캔과 김밥 키치 일러스트"
      >
        {/* Background decorative circle */}
        <circle cx={W / 2} cy={H / 2 + 10} r={145} fill={CREAM} stroke={YELLOW} strokeWidth={3} strokeDasharray="12 7" />
        <WavyBg />

        {/* Ground shadow */}
        <ellipse cx={W / 2} cy={H - 18} rx={115} ry={14} fill="rgba(0,0,0,0.10)" />

        {/* ── Can (center) ── */}
        <motion.g
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
          <ChilsungCan x={W / 2} y={H / 2 - 10} />
        </motion.g>

        {/* ── Gimbap pieces ── */}
        {/* Big piece top-center (sitting on can) */}
        <motion.g
          animate={{ y: [0, -8, 0], rotate: [-6, 6, -6] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
          style={{ originX: '50%', originY: '50%' }}>
          <GimbapPiece x={W / 2} y={H / 2 - 110} r={46} rotate={-8} />
        </motion.g>

        {/* Left gimbap piece */}
        <motion.g
          animate={{ y: [0, -5, 0], rotate: [12, 18, 12] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}>
          <GimbapPiece x={W / 2 - 115} y={H / 2 + 30} r={34} rotate={15} scale={0.85} />
        </motion.g>

        {/* Right gimbap piece */}
        <motion.g
          animate={{ y: [0, -7, 0], rotate: [-15, -9, -15] }}
          transition={{ duration: 3.0, repeat: Infinity, ease: 'easeInOut', delay: 1.0 }}>
          <GimbapPiece x={W / 2 + 118} y={H / 2 + 22} r={30} rotate={-12} scale={0.8} />
        </motion.g>

        {/* Small gimbap top-right */}
        <motion.g
          animate={{ y: [0, -9, 0], rotate: [20, 28, 20] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}>
          <GimbapPiece x={W / 2 + 88} y={H / 2 - 80} r={24} rotate={22} scale={0.65} />
        </motion.g>

        {/* Small gimbap top-left */}
        <motion.g
          animate={{ y: [0, -6, 0], rotate: [-22, -14, -22] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut', delay: 1.4 }}>
          <GimbapPiece x={W / 2 - 92} y={H / 2 - 72} r={22} rotate={-18} scale={0.6} />
        </motion.g>

        {/* ── Sparkles ── */}
        <Sparkle x={52} y={55} size={13} color={YELLOW} delay={0} />
        <Sparkle x={370} y={48} size={10} color={GREEN} delay={0.5} />
        <Sparkle x={30} y={200} size={9} color={GREEN} delay={1.1} />
        <Sparkle x={392} y={195} size={11} color={YELLOW} delay={0.8} />
        <Sparkle x={190} y={30} size={8} color={YELLOW} delay={1.5} />
        <Sparkle x={230} y={28} size={7} color={GREEN} delay={0.3} />
        <Sparkle x={88} y={290} size={9} color={YELLOW} delay={0.9} />
        <Sparkle x={338} y={285} size={8} color={GREEN} delay={1.3} />

        {/* ── Stars / dots decoration ── */}
        {[
          { x: 62, y: 135, s: 14, c: YELLOW },
          { x: 358, y: 140, s: 12, c: GREEN },
          { x: 165, y: 18, s: 10, c: '#E8A000' },
          { x: 258, y: 20, s: 10, c: GREEN },
          { x: 40, y: 255, s: 10, c: YELLOW },
          { x: 380, y: 250, s: 9, c: '#E8A000' },
        ].map((s, i) => (
          <motion.text key={i} x={s.x} y={s.y} fontSize={s.s} fill={s.c} textAnchor="middle"
            opacity={0.8}
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.9, 1.1, 0.9] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.25 }}>
            ★
          </motion.text>
        ))}

        {/* ── Dotted circles (vinyl record / label vibe) ── */}
        <circle cx={W / 2} cy={H / 2 - 10} r={155} fill="none" stroke={GREEN} strokeWidth={1} strokeDasharray="4 9" opacity={0.2} />
        <circle cx={W / 2} cy={H / 2 - 10} r={168} fill="none" stroke={YELLOW} strokeWidth={1} strokeDasharray="3 11" opacity={0.15} />

        {/* ── Speech bubbles ── */}
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}>
          <SpeechBubble x={96} y={H / 2 - 40} text="국민 드링크!" bg={YELLOW} textColor="#1A1A1A" />
        </motion.g>
        <motion.g
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 3.1, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}>
          <SpeechBubble x={W - 96} y={H / 2 - 48} text="찰떡 조합!" bg={GREEN} textColor="white" />
        </motion.g>

        {/* ── "×" connector between can text and concept ── */}
        <text x={W / 2} y={H - 8} textAnchor="middle" fontSize={9} fill="#999" fontWeight={700}
          fontFamily="'Noto Sans KR', sans-serif" letterSpacing={2}>
          칠성사이다 × 김밥 로드 2026
        </text>
      </svg>
    </div>
  );
}