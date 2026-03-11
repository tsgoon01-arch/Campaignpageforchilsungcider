import { InfluencerSection } from '../components/InfluencerSection';
import { Link } from 'react-router';
import { MapPin, ChevronRight, Stamp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStamp } from '../context/StampContext';
import { stores } from '../data/stores';
import { useState, useEffect, useCallback } from 'react';
import chilsungLogo from 'figma:asset/08d441681e4b572c719575a05a82eb624321bfac.png';

const STEPS = [
  { num: '01', emoji: '🗺️', title: '김밥집 찾기', desc: '지도에서 칠성사이다 추천 김밥대장 맛집 10곳을 찾아보세요.' },
  { num: '02', emoji: '📍', title: 'GPS 위치 인증', desc: '매장 반경 300m 이내에서 위치 확인 버튼을 누르면 자동으로 방문이 인증됩니다.' },
  { num: '03', emoji: '🎰', title: 'QR 룰렛 이벤트', desc: '매장 QR 스캔 시 룰렛 이벤트 참여! 칠성사이다 또는 한정판 티셔츠(50개)를 받아보세요.' },
];

const PRIZE_BADGES = [
  { stamps: 4,  emoji: '👕', label: '4스탬프', desc: '티셔츠 77명 추첨', color: '#EF4444', bg: '#FEF2F2' },
  { stamps: 7,  emoji: '🚂', label: '7스탬프', desc: '해랑열차 1명 추첨', color: '#E8A000', bg: '#FFFBEB' },
];

const GREEN    = '#2BAE4E';
const GREEN_BG = '#E8F8EF';
const YELLOW   = '#FFD740';
const BHS = "'Black Han Sans', sans-serif";

// ─── Slide backgrounds & content ──────────────────────────────────────────────
const HERO_SLIDES = [
  {
    bg: 'linear-gradient(135deg, #0D1B2A 0%, #162340 45%, #0a1520 100%)',
    patternColor: 'rgba(255,215,64,0.06)',
    eyebrow: '🎰 매장 QR 스캔 → 즉시 당첨!',
    line1: '돌려라',
    line2: '룰렛!',
    desc: (
      <>
        칠성사이다 1+1 증정권 또는{' '}
        <strong style={{ color: YELLOW, fontWeight: 700 }}>한정판 티셔츠(50개)</strong>를 받아가세요!<br />
        매장 방문 후 QR 스캔 · <strong style={{ color: YELLOW }}>100% 당첨</strong>
      </>
    ),
    isRoulette: true,
    ctas: [
      { to: '/event?store=daejang-hongdae&name=김밥대장 홍대본점', label: '🎰 룰렛 돌리러 가기!', style: 'yellow' as const },
      { to: '/map', label: '🗺️ 참여 매장 찾기', style: 'green' as const },
    ],
  },
  {
    bg: 'linear-gradient(135deg, #0A1F12 0%, #1A3A22 50%, #0A1F12 100%)',
    patternColor: 'rgba(43,174,78,0.07)',
    eyebrow: '🎁 스탬프 달성 시 자동 추첨 응모!',
    line1: '스탬프',
    line2: '리워드!',
    desc: (
      <>
        4곳 방문 <strong style={{ color: YELLOW, fontWeight: 700 }}>👕 티셔츠 77명 추첨</strong> · 7곳 방문{' '}
        <strong style={{ color: '#86EFAC', fontWeight: 700 }}>🚂 해랑열차 1명 추첨</strong>
        <br />김밥집을 방문하면 스탬프가 자동으로 쌓여요!
      </>
    ),
    isRoulette: false,
    isReward: true,
    ctas: [
      { to: '/map', label: '🗺️ 매장 방문하고 스탬프 모으기', style: 'green' as const },
      { to: '/prizes', label: '🎁 리워드 확인하기', style: 'outline' as const },
    ],
  },
];

// ─── Roulette Wheel (decorative) ───────────────────────────────────────────────
const WHEEL_SEGMENTS = [
  { label: '사이다\n1+1', emoji: '🥤', color: '#0057B8' },
  { label: '한정판\n티셔츠', emoji: '👕', color: '#EF4444' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#2BAE4E' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#7C3AED' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#0369A1' },
  { label: '한정판\n티셔츠', emoji: '👕', color: '#B91C1C' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#059669' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#D97706' },
];

function DecorativeWheel() {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  const segCount = WHEEL_SEGMENTS.length;
  const segAngle = 360 / segCount;

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Outer glow ring */}
        <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke="rgba(255,215,64,0.25)" strokeWidth={8} />
        <circle cx={cx} cy={cy} r={r} fill="#0D1B2A" />

        {WHEEL_SEGMENTS.map((seg, i) => {
          const startAngle = (i * segAngle - 90) * (Math.PI / 180);
          const endAngle   = ((i + 1) * segAngle - 90) * (Math.PI / 180);
          const x1 = cx + r * Math.cos(startAngle);
          const y1 = cy + r * Math.sin(startAngle);
          const x2 = cx + r * Math.cos(endAngle);
          const y2 = cy + r * Math.sin(endAngle);
          const midAngle = ((i + 0.5) * segAngle - 90) * (Math.PI / 180);
          const tr = r * 0.65;
          const tx = cx + tr * Math.cos(midAngle);
          const ty = cy + tr * Math.sin(midAngle);
          const textRot = (i + 0.5) * segAngle;
          return (
            <g key={i}>
              <path
                d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                fill={seg.color}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth={1.5}
              />
              <g transform={`translate(${tx},${ty}) rotate(${textRot})`}>
                <text textAnchor="middle" dominantBaseline="middle"
                  fill="white" fontSize="16" fontWeight="800"
                  style={{ userSelect: 'none' }}>
                  {seg.emoji}
                </text>
              </g>
            </g>
          );
        })}
        {/* Center hub */}
        <circle cx={cx} cy={cy} r={28} fill="white" />
        <circle cx={cx} cy={cy} r={23} fill={GREEN} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="14" fontWeight="900" fill="white" fontFamily={BHS}>七</text>
      </svg>
    </motion.div>
  );
}

// ─── Floating Emoji Visual (non-roulette slides) ────────────────────────────────
function FloatingEmojis({ emojis }: { emojis: string[] }) {
  const positions = [
    { x: '55%', y: '15%', size: 64, delay: 0 },
    { x: '75%', y: '38%', size: 80, delay: 0.4 },
    { x: '52%', y: '60%', size: 52, delay: 0.8 },
    { x: '72%', y: '68%', size: 44, delay: 0.2 },
    { x: '85%', y: '25%', size: 36, delay: 0.6 },
  ];
  return (
    <>
      {emojis.slice(0, 5).map((emoji, i) => (
        <motion.div
          key={i}
          style={{
            position: 'absolute',
            left: positions[i].x,
            top: positions[i].y,
            fontSize: positions[i].size,
            lineHeight: 1,
            zIndex: 3,
            filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.5))',
            pointerEvents: 'none',
          }}
          animate={{
            y: [0, -14, 0],
            rotate: [-4, 4, -4],
            scale: [1, 1.06, 1],
          }}
          transition={{
            duration: 3.5 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: positions[i].delay,
          }}
        >
          {emoji}
        </motion.div>
      ))}
    </>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection({ stampCount }: { stampCount: number }) {
  const [slide, setSlide] = useState(0);

  const goNext = useCallback(() => {
    setSlide((s) => (s + 1) % HERO_SLIDES.length);
  }, []);

  const goPrev = useCallback(() => {
    setSlide((s) => (s - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(goNext, 5500);
    return () => clearInterval(timer);
  }, [goNext]);

  const current = HERO_SLIDES[slide];

  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>

      {/* Top stripe */}
      <div style={{
        height: '6px',
        background: `repeating-linear-gradient(90deg, ${GREEN} 0, ${GREEN} 20px, ${YELLOW} 20px, ${YELLOW} 40px)`,
        position: 'relative', zIndex: 2,
      }} />

      {/* Slide wrapper */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'relative',
            minHeight: 'clamp(560px, 82vh, 900px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: current.bg,
            overflow: 'hidden',
          }}
        >
          {/* Grid pattern */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            backgroundImage: `linear-gradient(${current.patternColor} 1px, transparent 1px), linear-gradient(90deg, ${current.patternColor} 1px, transparent 1px)`,
            backgroundSize: '44px 44px',
          }} />

          {/* Radial glow */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
            background: current.isRoulette
              ? 'radial-gradient(ellipse 60% 70% at 75% 50%, rgba(255,215,64,0.12) 0%, transparent 70%)'
              : 'radial-gradient(ellipse 55% 65% at 70% 45%, rgba(255,255,255,0.05) 0%, transparent 70%)',
          }} />

          {/* Floating star sparks */}
          {[...Array(6)].map((_, i) => (
            <motion.div key={i}
              style={{
                position: 'absolute', zIndex: 1,
                left: `${8 + i * 14}%`, top: `${10 + (i * 11) % 55}%`,
                color: i % 2 === 0 ? YELLOW : GREEN,
                fontSize: 12 + (i * 3) % 10,
                opacity: 0.35, pointerEvents: 'none',
              }}
              animate={{ y: [0, -12, 0], opacity: [0.25, 0.55, 0.25] }}
              transition={{ duration: 3.2 + i * 0.6, repeat: Infinity, delay: i * 0.4 }}
            >★</motion.div>
          ))}

          {/* Right-side visual */}
          <div style={{
            position: 'absolute',
            right: 'clamp(16px, 6vw, 80px)',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {current.isRoulette ? (
              <div style={{ position: 'relative' }}>
                {/* Pointer */}
                <div style={{
                  position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                  zIndex: 10, width: 0, height: 0,
                  borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
                  borderTop: '22px solid #EF4444',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.6))',
                }} />
                {/* Glow behind wheel */}
                <div style={{
                  position: 'absolute', inset: -20,
                  borderRadius: '50%',
                  boxShadow: '0 0 60px 20px rgba(255,215,64,0.18), 0 0 120px 40px rgba(43,174,78,0.1)',
                }} />
                <DecorativeWheel />
                {/* Prize tags */}
                <motion.div
                  animate={{ x: [0, -6, 0], y: [0, -4, 0] }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                  style={{
                    position: 'absolute', top: 10, left: -70,
                    background: 'rgba(0,87,184,0.85)', backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(0,87,184,0.6)',
                    borderRadius: 12, padding: '6px 10px',
                    whiteSpace: 'nowrap',
                  }}>
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>🥤 사이다 1+1</p>
                </motion.div>
                <motion.div
                  animate={{ x: [0, 6, 0], y: [0, 4, 0] }}
                  transition={{ duration: 3.2, repeat: Infinity, delay: 0.8 }}
                  style={{
                    position: 'absolute', bottom: 16, right: -68,
                    background: 'rgba(185,28,28,0.85)', backdropFilter: 'blur(8px)',
                    border: '1.5px solid rgba(239,68,68,0.5)',
                    borderRadius: 12, padding: '6px 10px',
                    whiteSpace: 'nowrap',
                  }}>
                  <p style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>👕 한정판 티셔츠</p>
                </motion.div>
              </div>
            ) : current.isReward ? (
              /* ─── Reward slide visual ─── */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 4스탬프 card */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                  style={{
                    background: 'rgba(239,68,68,0.18)',
                    border: '1.5px solid rgba(239,68,68,0.55)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 18, padding: '16px 20px', minWidth: 190,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 36 }}>👕</span>
                    <div>
                      <p style={{ color: '#FCA5A5', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>4스탬프 리워드</p>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>한정판 티셔츠</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>77명 추첨</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, padding: '5px 10px', borderRadius: 8, backgroundColor: 'rgba(239,68,68,0.3)', textAlign: 'center' }}>
                    <p style={{ color: '#FCA5A5', fontSize: 10, fontWeight: 700 }}>🔥 칠성사이다 × 김밥대장 콜라보</p>
                  </div>
                </motion.div>

                {/* 7스탬프 card */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
                  style={{
                    background: 'rgba(232,160,0,0.18)',
                    border: '1.5px solid rgba(232,160,0,0.55)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 18, padding: '16px 20px', minWidth: 190,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 36 }}>🚂</span>
                    <div>
                      <p style={{ color: '#FCD34D', fontSize: 10, fontWeight: 700, letterSpacing: '0.5px', marginBottom: 2 }}>7스탬프 리워드</p>
                      <p style={{ color: 'white', fontSize: 13, fontWeight: 800, lineHeight: 1.2 }}>해랑열차</p>
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>1명 추첨</p>
                    </div>
                  </div>
                  <div style={{ marginTop: 10, padding: '5px 10px', borderRadius: 8, backgroundColor: 'rgba(232,160,0,0.3)', textAlign: 'center' }}>
                    <p style={{ color: '#FCD34D', fontSize: 10, fontWeight: 700 }}>🚄 코레일 해랑열차 탑승권</p>
                  </div>
                </motion.div>

                {/* CTA arrow */}
                <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 2, repeat: Infinity }}
                  style={{ textAlign: 'center' }}>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600 }}>스탬프 달성 시 자동 응모 ↑</p>
                </motion.div>
              </div>
            ) : null}
          </div>

          {/* Logo pill */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{
              position: 'absolute', top: '20px', left: '20px', zIndex: 5,
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(8px)',
              borderRadius: '100px', padding: '5px 12px 5px 6px',
              border: '1px solid rgba(255,255,255,0.15)',
            }}>
            <img src={chilsungLogo} alt="칠성사이다" style={{ height: '26px', width: 'auto', borderRadius: '5px' }} />
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px' }}>STAMP TOUR 2026</span>
          </motion.div>

          {/* Campaign badge */}
          

          {/* Text content */}
          <div style={{
            padding: 'clamp(24px,5vw,60px) clamp(20px,6vw,72px) clamp(48px,6vh,80px)',
            position: 'relative', zIndex: 5,
            maxWidth: '52%',
          }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <p style={{ color: YELLOW, fontSize: 'clamp(11px,1.8vw,13px)', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '8px', textTransform: 'uppercase' }}>
                {current.eyebrow}
              </p>

              <div style={{ marginBottom: '14px' }}>
                <span style={{ display: 'block', fontFamily: BHS, fontSize: 'clamp(44px,8vw,100px)', color: 'white', letterSpacing: '-2px', lineHeight: 0.95 }}>
                  {current.line1}
                </span>
                <motion.span
                  animate={{ color: [GREEN, '#1DBF5B', YELLOW, GREEN] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ display: 'block', fontFamily: BHS, fontSize: 'clamp(44px,8vw,100px)', letterSpacing: '-2px', lineHeight: 1.0 }}
                >
                  {current.line2}
                </motion.span>
              </div>

              <p style={{ color: 'rgba(255,255,255,0.72)', fontSize: 'clamp(13px,1.8vw,15px)', fontWeight: 400, maxWidth: '400px', lineHeight: 1.7, marginBottom: '22px' }}>
                {current.desc}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {current.ctas.map((cta, i) => (
                  <Link key={i} to={cta.to} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    background: cta.style === 'yellow'
                      ? `linear-gradient(135deg, ${YELLOW}, #FFA000)`
                      : cta.style === 'green'
                      ? GREEN
                      : 'transparent',
                    color: cta.style === 'yellow' ? '#1A1A1A' : '#fff',
                    padding: '12px 22px', borderRadius: '100px',
                    fontWeight: cta.style === 'yellow' ? 800 : 700,
                    fontSize: '14px', textDecoration: 'none',
                    ...(cta.style === 'yellow' ? { boxShadow: '0 0 24px rgba(255,215,64,0.45)' } : {}),
                    ...(cta.style === 'outline' ? {
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      border: '1.5px solid rgba(255,255,255,0.3)',
                      backdropFilter: 'blur(6px)',
                      fontWeight: 600,
                    } : {}),
                  }}>{cta.label}</Link>
                ))}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Ticker */}
      <div style={{ backgroundColor: '#1A1A1A', overflow: 'hidden', padding: '7px 0', borderTop: `2px solid ${GREEN}`, borderBottom: `2px solid ${GREEN}` }}>
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
          style={{ display: 'flex', whiteSpace: 'nowrap' }}>
          {[...Array(2)].map((_, rep) => (
            <span key={rep} style={{ display: 'inline-flex', alignItems: 'center', gap: '28px', paddingRight: '28px' }}>
              {['🎰 룰렛 이벤트 진행 중', '칠성사이다 × 스탬프 투어', '김밥엔 사이다!', '서울 김밥 핫플 10곳', '매장당 1회 참여 + 다시 돌리기 2회', '2026 김밥대장 로드', '👕 4스탬프 티셔츠 추첨', '🚂 7스탬프 해랑열차'].map((txt, i) => (
                <span key={i} style={{ fontSize: '11px', fontWeight: 700, color: i % 2 === 0 ? YELLOW : GREEN, letterSpacing: '1.2px' }}>
                  ★ {txt}
                </span>
              ))}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Store Card ───────────────────────────────────────────────────────────────
function StoreCard({ store, index }: { store: typeof stores[0]; index: number }) {
  const isSpecial = store.isSpecial;
  const isGold = store.markerColor === '#E8A000';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.18 } }}
      transition={{ delay: index * 0.06 }}
      viewport={{ once: true }}
      className="bg-white rounded-2xl overflow-hidden"
      style={{ border: `1.5px solid ${isSpecial ? store.markerColor + '66' : '#E5E7EB'}` }}
    >
      <div className="relative h-44 overflow-hidden">
        <img src={store.image} alt={store.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
        <div className="absolute top-3 left-3">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ backgroundColor: isSpecial ? store.markerColor : YELLOW, color: isSpecial ? 'white' : '#1A1A1A' }}>
            {store.categoryIcon} {isSpecial ? '콜라보 · 김밥대장' : store.category}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-white text-xs px-2 py-1 rounded-lg"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', fontSize: '11px', fontWeight: 600 }}>
            #{String(index + 1).padStart(2, '0')}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)' }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)' }}>{store.vibe}</span>
        </div>
      </div>
      <div className="p-4">
        {isSpecial && (
          <div className="mb-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: isGold ? '#FFFBEB' : '#FAF5FF', color: store.markerColor }}>
            ✦ 칠성사이다 공식 콜라보 매장
          </div>
        )}
        <h3 style={{ fontWeight: 700, fontSize: '15px', color: '#1A1A1A', marginBottom: '3px' }}>{store.name}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
          <MapPin size={11} /><span>{store.district}</span><span>·</span><span>{store.menu.split(',')[0]}</span>
        </div>
        <p className="text-gray-500 text-xs leading-relaxed mb-3"
          style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {store.chilsungPairing}
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {store.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: isSpecial ? (isGold ? '#FEF3C7' : '#F3E8FF') : '#F0FDF4',
                color: isSpecial ? store.markerColor : GREEN,
              }}>
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function HomePage() {
  const { stampCount } = useStamp();

  return (
    <div style={{ backgroundColor: '#FFFFFF' }}>
      <HeroSection stampCount={stampCount} />
      <InfluencerSection />

      {stampCount > 0 && (
        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 text-white"
              style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-green-100 text-sm mb-1">내 스탬프 현황</p>
                  <p style={{ fontFamily: BHS, fontSize: '26px' }}>🎯 {stampCount}개 모았어요!</p>
                  <p className="text-green-100 text-sm mt-1">
                    {stampCount < 3 && `브론즈 경품까지 ${3 - stampCount}개 남았어요`}
                    {stampCount >= 3 && stampCount < 10 && `그랜드 경품까지 ${10 - stampCount}개 남았어요`}
                    {stampCount >= 10 && '🎉 모든 스탬프 완주! 그랜드 경품에 응모하세요!'}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link to="/stamps" className="px-5 py-2.5 rounded-full bg-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    style={{ color: GREEN }}>스탬프 확인</Link>
                  {stampCount >= 3 && (
                    <Link to="/prizes" className="px-5 py-2.5 rounded-full text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                      style={{ border: '1.5px solid rgba(255,255,255,0.55)' }}>경품 응모</Link>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full rounded-full h-2.5" style={{ backgroundColor: 'rgba(0,0,0,0.18)' }}>
                  <motion.div className="h-2.5 rounded-full" style={{ backgroundColor: YELLOW }}
                    initial={{ width: 0 }} animate={{ width: `${(stampCount / 10) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="py-16 px-4" style={{ backgroundColor: '#FAFBFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-block text-xs px-3 py-1 rounded-full mb-3 font-semibold"
              style={{ background: GREEN_BG, color: GREEN }}>참여 방법</span>
            <h2 style={{ fontFamily: BHS, fontSize: '28px', color: '#1A1A1A' }}>3단계로 끝나는<br />스탬프 투어!</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {STEPS.map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="bg-white rounded-2xl p-7 relative overflow-hidden"
                style={{ border: '1.5px solid #E5E7EB' }}>
                <div className="absolute top-4 right-5 text-7xl" style={{ color: '#F0FDF4', lineHeight: 1, fontFamily: BHS }}>{s.num}</div>
                <div className="text-4xl mb-4">{s.emoji}</div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1A1A1A', marginBottom: '6px' }}>{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Store cards */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🍙</span>
                <span className="inline-block text-xs px-3 py-1 rounded-full font-semibold"
                  style={{ backgroundColor: '#FFF9DB', color: '#997000' }}>김밥 맛집</span>
              </div>
              <h2 style={{ fontFamily: BHS, fontSize: '24px', color: '#1A1A1A' }}>칠성 추천 김밥집 8</h2>
            </div>
            <Link to="/map" className="hidden md:flex items-center gap-1 text-sm font-semibold hover:underline"
              style={{ color: GREEN }}>
              지도에서 보기 <ChevronRight size={15} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {stores.filter((s) => !s.isSpecial).map((store, i) => (
              <StoreCard key={store.id} store={store} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Prizes preview */}
      <section className="py-16 px-4" style={{ backgroundColor: '#FAFBFF' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block text-xs px-3 py-1 rounded-full mb-2 font-semibold"
              style={{ backgroundColor: '#FFF8E1', color: '#997000' }}>리워드 안내</span>
            <h2 style={{ fontFamily: BHS, fontSize: '26px', color: '#1A1A1A' }}>체크인이 많을수록 리워드가 커져요! 🎉</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PRIZE_BADGES.map((p, i) => (
              <motion.div key={p.stamps}
                initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                className="rounded-2xl p-5 text-center"
                style={{ backgroundColor: p.bg, border: `1.5px solid ${p.color}22` }}>
                <div className="text-4xl mb-2">{p.emoji}</div>
                <div className="text-xl mb-0.5 font-bold" style={{ color: p.color }}>{p.stamps}회</div>
                <div className="text-xs text-gray-400 mb-1">체크인</div>
                <div className="text-sm font-semibold text-gray-800">{p.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{p.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative rounded-3xl p-10 md:p-16 text-center text-white overflow-hidden"
            style={{ backgroundColor: GREEN }}>
            {['10%', '80%', '45%'].map((left, i) => (
              <div key={i} className="absolute rounded-full bg-white/10 pointer-events-none"
                style={{ width: `${100 + i * 60}px`, height: `${100 + i * 60}px`, top: `${[-20, 50, -30][i]}%`, left }} />
            ))}
            <div className="relative">
              <div className="text-5xl mb-4">🍙</div>
              <h2 style={{ fontFamily: BHS, fontSize: '28px', marginBottom: '10px' }}>김밥대장 로드를 완주하세요!</h2>
              <p className="text-green-100 text-sm mb-7 max-w-md mx-auto leading-relaxed">
                칠성사이다 추천 김밥집 10곳을 방문하고<br />제주도 여행권에 도전해 보세요!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/map" className="px-7 py-3 bg-white rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
                  style={{ color: GREEN }}>🗺️ 김밥 지도 보기</Link>
                <Link to="/stamps" className="px-7 py-3 rounded-full text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                  style={{ border: '1.5px solid rgba(255,255,255,0.5)' }}>
                  <Stamp size={13} className="inline mr-1.5" />내 스탬프 ({stampCount}/10)
                </Link>
                <Link to="/prizes" className="px-7 py-3 rounded-full text-sm font-semibold text-gray-900 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: YELLOW }}>🎁 내 리워드</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;