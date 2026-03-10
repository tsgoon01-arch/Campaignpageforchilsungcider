import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const GREEN = '#2BAE4E';
const YELLOW = '#FFD740';
const DEVICE_ID_KEY = 'chilsung-device-id';
const PENDING_PRIZE_KEY = 'pending-roulette-prize';

// 1 spin per store per day (no re-spins)
const MAX_SPINS = 1;

// ── Device / Auth helpers ─────────────────────────────────────────────────────
function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}
function getAuthToken(): string | null {
  try {
    const raw = localStorage.getItem('chilsung-auth-session');
    if (!raw) return null;
    const token = JSON.parse(raw)?.access_token ?? null;
    // demo-token은 실제 Supabase 토큰이 아니므로 API에는 사용 불가
    if (token === 'demo-token') return null;
    return token;
  } catch { return null; }
}
function isLoggedIn(): boolean {
  // 데모 로그인도 로그인으로 인정 (UI 표시용)
  try {
    const raw = localStorage.getItem('chilsung-auth-session');
    if (!raw) return false;
    const session = JSON.parse(raw);
    return !!(session?.user || session?.access_token);
  } catch { return false; }
}

// Short voucher code from full id
function shortCode(id: string) {
  return id.replace(/-/g, '').slice(-8).toUpperCase();
}

// ── Wheel segments (updated prize IDs) ───────────────────────────────────────
const SEGMENTS = [
  { emoji: '🥤', color: '#0057B8', prizeId: 'soda-free' },
  { emoji: '👕', color: '#EF4444', prizeId: 'tshirt' },
  { emoji: '🥤', color: '#2BAE4E', prizeId: 'soda-free' },
  { emoji: '🥤', color: '#7C3AED', prizeId: 'soda-free' },
  { emoji: '🥤', color: '#0369A1', prizeId: 'soda-free' },
  { emoji: '👕', color: '#B91C1C', prizeId: 'tshirt' },
  { emoji: '🥤', color: '#059669', prizeId: 'soda-free' },
  { emoji: '🥤', color: '#D97706', prizeId: 'soda-free' },
];
const SEGMENT_COUNT = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const PRIZE_SEGMENTS: Record<string, number[]> = {
  'soda-free': [0, 2, 3, 4, 6, 7],
  'tshirt': [1, 5],
};

interface PrizeResult {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
}
interface SpinRecord {
  prizeId: string;
  prizeName: string;
  prizeEmoji: string;
  prizeColor: string;
  couponId: string;
  storeId: string;
  storeName: string;
  timestamp: string;
}

// ── Roulette Wheel ────────────────────────────────────────────────────────────
function RouletteWheel({ rotation, isSpinning }: { rotation: number; isSpinning: boolean }) {
  const size = 300; const cx = size / 2; const cy = size / 2; const r = size / 2 - 4;
  return (
    <div className="relative select-none" style={{ width: size + 20, height: size + 20 }}>
      <div className="absolute z-20" style={{
        top: -4, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
        borderTop: '32px solid #EF4444',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
      }} />
      <div className="absolute inset-0 rounded-full" style={{
        margin: 10,
        boxShadow: isSpinning
          ? `0 0 50px 15px rgba(255,215,64,0.7), 0 0 100px 30px rgba(43,174,78,0.4)`
          : `0 0 20px 4px rgba(43,174,78,0.3)`,
        transition: 'box-shadow 0.4s',
      }} />
      <motion.div className="absolute" style={{ top: 10, left: 10, width: size, height: size }}
        animate={{ rotate: rotation }}
        transition={isSpinning ? { duration: 4.5, ease: [0.1, 0.9, 0.3, 1] } : { duration: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="#0D1B2A" />
          {SEGMENTS.map((seg, i) => {
            const sa = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const ea = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const x1 = cx + r * Math.cos(sa); const y1 = cy + r * Math.sin(sa);
            const x2 = cx + r * Math.cos(ea); const y2 = cy + r * Math.sin(ea);
            const ma = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const tr = r * 0.66;
            const tx = cx + tr * Math.cos(ma); const ty = cy + tr * Math.sin(ma);
            return (
              <g key={i}>
                <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill={seg.color} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
                <g transform={`translate(${tx},${ty}) rotate(${(i + 0.5) * SEGMENT_ANGLE})`}>
                  <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="15" fontWeight="800"
                    style={{ userSelect: 'none' }}>{seg.emoji}</text>
                </g>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={30} fill="white" />
          <circle cx={cx} cy={cy} r={26} fill={GREEN} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fontSize="15" fontWeight="900" fill="white">七</text>
        </svg>
      </motion.div>
    </div>
  );
}

// ── Spin Chance Badge ─────────────────────────────────────────────────────────
function SpinChanceBadge({ spinsToday }: { spinsToday: number }) {
  const done = spinsToday >= 1;
  return done ? (
    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black"
      style={{ backgroundColor: 'rgba(255,255,255,0.08)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>
      ✅ 오늘 참여 완료
    </div>
  ) : (
    <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black"
      style={{ backgroundColor: `${GREEN}22`, color: GREEN, border: `1px solid ${GREEN}44` }}>
      🎰 1회 참여 가능
    </div>
  );
}

// ── Prize Result Modal ────────────────────────────────────────────────────────
function PrizeModal({
  prize, couponId, storeName, tshirtRemaining,
  isLoggedInUser, onClose, onGoMyPage, onLoginToClaim,
}: {
  prize: PrizeResult;
  couponId: string;
  storeName: string;
  tshirtRemaining: number;
  isLoggedInUser: boolean;
  onClose: () => void;
  onGoMyPage: () => void;
  onLoginToClaim: () => void;
}) {
  const [step, setStep] = useState<'reveal' | 'claimed'>('reveal');
  const isTshirt = prize.id === 'tshirt';
  const code = shortCode(couponId);

  const handleClaim = () => {
    setStep('claimed');
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}>
      <motion.div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}>

        {/* Banner */}
        <div className="relative overflow-hidden"
          style={{ background: step === 'claimed'
            ? `linear-gradient(135deg, ${GREEN}, #00C853)`
            : `linear-gradient(135deg, ${prize.color}, ${prize.color}99)`, paddingBottom: '24px' }}>
          {/* confetti */}
          {[...Array(8)].map((_, i) => (
            <motion.div key={i} className="absolute w-2 h-2 rounded-full"
              style={{ backgroundColor: i % 2 === 0 ? YELLOW : 'white', left: `${8 + i * 12}%`, top: '15%', opacity: 0.7 }}
              animate={{ y: [0, -18, 0], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 1 + i * 0.12, repeat: Infinity, delay: i * 0.1 }} />
          ))}

          <div className="pt-8 pb-2 text-center">
            <AnimatePresence mode="wait">
              {step === 'reveal' ? (
                <motion.div key="reveal" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, delay: 0.1 }}>
                  <div className="text-7xl mb-2">{prize.emoji}</div>
                  <h2 className="text-white font-black text-2xl">🎉 당첨!</h2>
                </motion.div>
              ) : (
                <motion.div key="claimed" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 350 }}>
                  <div className="text-6xl mb-2">✅</div>
                  <h2 className="text-white font-black text-xl">증정권 저장 완료!</h2>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Perforated divider */}
          <div className="flex items-center mt-3 px-4">
            <div className="w-5 h-5 rounded-full bg-white -ml-6" />
            <div className="flex-1 border-t-2 border-dashed border-white/30 mx-2" />
            <div className="w-5 h-5 rounded-full bg-white -mr-6" />
          </div>
        </div>

        {/* Coupon body */}
        <div className="px-5 pt-4 pb-5">
          {/* ── Step 1: Reveal ── */}
          {step === 'reveal' && (
            <>
              {isTshirt && (
                <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
                  style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
                  <span>🔥</span>
                  <p className="text-xs font-black text-red-500">한정 {tshirtRemaining}개 남음! 정말 행운이에요!</p>
                </div>
              )}

              <h3 className="font-black text-gray-900 text-center text-lg mb-0.5">{prize.name}</h3>
              <p className="text-center text-xs text-gray-400 mb-4">📍 {storeName}</p>

              {/* Mini voucher preview */}
              <div className="rounded-2xl p-4 mb-4 text-center"
                style={{ backgroundColor: prize.color + '10', border: `1.5px dashed ${prize.color}55` }}>
                <p className="text-xs text-gray-500 mb-1">매장 직원에게 이 화면을 보여주세요</p>
                <p className="font-black text-lg tracking-widest mb-1" style={{ color: prize.color }}>{code}</p>
                <p className="text-xs" style={{ color: prize.color + 'AA' }}>매장 증정권 · 30일 유효</p>
              </div>

              <p className="text-xs text-gray-500 text-center mb-4 leading-relaxed">
                {prize.description}
              </p>

              {/* Single CTA: 증정권 받기 */}
              {isLoggedInUser ? (
                <motion.button onClick={handleClaim}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl font-black text-gray-900 flex items-center justify-center gap-2 text-sm"
                  style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFA000)`, boxShadow: `0 4px 16px rgba(255,215,64,0.5)` }}>
                  🎫 증정권 받기
                </motion.button>
              ) : (
                <motion.button onClick={onLoginToClaim}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl font-black text-white flex items-center justify-center gap-2 text-sm"
                  style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)`, boxShadow: `0 4px 16px rgba(43,174,78,0.4)` }}>
                  🔐 로그인하고 증정권 받기
                </motion.button>
              )}

              {!isLoggedInUser && (
                <div className="mt-3 px-3 py-2.5 rounded-xl"
                  style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' }}>
                  <p className="text-xs text-amber-700 text-center">
                    ⚠️ 로그인하지 않으면 증정권이 저장되지 않아요
                  </p>
                </div>
              )}
            </>
          )}

          {/* ── Step 2: Claimed ── */}
          {step === 'claimed' && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              {/* Saved confirmation */}
              <div className="rounded-2xl p-4 mb-4 text-center"
                style={{ backgroundColor: '#F0FDF4', border: `1.5px solid #86EFAC` }}>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl">{prize.emoji}</span>
                  <div className="text-left">
                    <p className="font-black text-sm text-gray-900">{prize.name}</p>
                    <p className="text-xs text-gray-400">📍 {storeName}</p>
                  </div>
                </div>
                <div className="border-t border-dashed my-2" style={{ borderColor: '#86EFAC' }} />
                <p className="font-black text-sm tracking-widest" style={{ color: GREEN }}>{code}</p>
                <p className="text-xs text-gray-500 mt-1">마이페이지 &gt; 내 증정권에서 확인 가능</p>
              </div>

              <div className="space-y-2.5">
                <motion.button onClick={onGoMyPage}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="w-full py-3.5 rounded-2xl font-black text-gray-900 flex items-center justify-center gap-2 text-sm"
                  style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFA000)`, boxShadow: `0 4px 16px rgba(255,215,64,0.5)` }}>
                  🎫 마이페이지에서 증정권 확인
                </motion.button>
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl font-black border-2 text-sm text-gray-400"
                  style={{ borderColor: '#E5E7EB' }}>
                  닫기
                </button>
              </div>
            </motion.div>
          )}

          <p className="text-center text-xs text-gray-300 mt-3">* 데모 환경 · 실제 경품 미지급</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function RouletteEventPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const storeId = searchParams.get('store') || 'unknown';
  const storeName = searchParams.get('name') || '김밥대장';

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [currentPrize, setCurrentPrize] = useState<PrizeResult | null>(null);
  const [currentCouponId, setCurrentCouponId] = useState('');
  const [tshirtRemaining, setTshirtRemaining] = useState(50);
  const [spinsToday, setSpinsToday] = useState(0);
  const [canSpin, setCanSpin] = useState(true);
  const [todayResults, setTodayResults] = useState<SpinRecord[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [serverError, setServerError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const deviceId = getOrCreateDeviceId();
  const authToken = getAuthToken();
  const loggedIn = isLoggedIn();

  useEffect(() => {
    fetch(`${SERVER_URL}/roulette/stock`, { headers: { Authorization: `Bearer ${publicAnonKey}` } })
      .then((r) => r.json())
      .then((d) => { if (d.tshirt_remaining !== undefined) setTshirtRemaining(d.tshirt_remaining); })
      .catch(console.error);
    checkDailyStatus();
  }, [storeId, deviceId]);

  const checkDailyStatus = async () => {
    setIsCheckingStatus(true);
    try {
      const params = new URLSearchParams({ storeId, deviceId });
      const res = await fetch(`${SERVER_URL}/roulette/check?${params}`, {
        headers: { Authorization: `Bearer ${authToken || publicAnonKey}` },
      });
      const d = await res.json();
      setSpinsToday(d.spinsToday || 0);
      setCanSpin(d.canSpin !== false);
      setTodayResults(d.todayResults || []);
    } catch (err) { console.error(err); }
    finally { setIsCheckingStatus(false); }
  };

  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;
    setIsSpinning(true);
    setServerError('');
    setShowModal(false);

    try {
      const res = await fetch(`${SERVER_URL}/roulette/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken || publicAnonKey}` },
        body: JSON.stringify({ storeId, storeName, deviceId }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setServerError(data.error || '룰렛 오류가 발생했습니다.');
        setIsSpinning(false);
        if (data.spinsToday !== undefined) { setSpinsToday(data.spinsToday); setCanSpin(data.spinsToday < MAX_SPINS); }
        return;
      }

      const wonPrize: PrizeResult = data.prize;
      if (data.tshirt_remaining !== undefined) setTshirtRemaining(data.tshirt_remaining);

      // Wheel animation target
      const segs = PRIZE_SEGMENTS[wonPrize.id] ?? [0];
      const targetSeg = segs[Math.floor(Math.random() * segs.length)];
      const targetAngle = 360 - (targetSeg * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
      const fullSpins = 5 + Math.floor(Math.random() * 4);
      const totalRot = rotation + fullSpins * 360 + targetAngle - (rotation % 360);
      setRotation(totalRot);
      setCurrentPrize(wonPrize);
      setCurrentCouponId(data.couponId || '');

      // Save pending for non-logged-in users
      if (!loggedIn && data.couponId) {
        const pending = {
          prizeId: wonPrize.id, prizeName: wonPrize.name, prizeEmoji: wonPrize.emoji, prizeColor: wonPrize.color,
          storeId, storeName, couponId: data.couponId, timestamp: new Date().toISOString(),
        };
        const stored = JSON.parse(sessionStorage.getItem(PENDING_PRIZE_KEY) || '[]');
        stored.push(pending);
        sessionStorage.setItem(PENDING_PRIZE_KEY, JSON.stringify(stored));
      }

      const newSpinsToday = data.spinsToday || spinsToday + 1;
      setTimeout(() => {
        setIsSpinning(false);
        setSpinsToday(newSpinsToday);
        setCanSpin(newSpinsToday < MAX_SPINS);
        setShowModal(true);
        checkDailyStatus();
      }, 4800);
    } catch (err) {
      console.error('Spin error:', err);
      setServerError(`네트워크 오류: ${err}`);
      setIsSpinning(false);
    }
  };

  const handleGoMyPage = () => navigate('/mypage');
  const handleLoginToClaim = () => navigate(`/login?return=/mypage&claim=1`);

  return (
    <div className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(160deg,#0D1B2A 0%,#1a2744 45%,#0D1B2A 100%)', overflow: 'hidden' }}>
      {/* BG orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{
              width: 20 + (i * 7) % 80, height: 20 + (i * 7) % 80,
              backgroundColor: i % 3 === 0 ? GREEN : i % 3 === 1 ? YELLOW : '#fff',
              left: `${(i * 13) % 100}%`, top: `${(i * 17) % 100}%`, opacity: 0.05,
            }}
            animate={{ y: [0, -24, 0], opacity: [0.03, 0.1, 0.03] }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, delay: i * 0.3 }} />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
        {/* Header */}
        <div className="text-center mb-5 w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg,${GREEN},#00C853)` }}>
              <span className="text-white font-black text-lg">七</span>
            </div>
            <span className="text-white font-black text-lg">칠성사이다 × 김밥대장</span>
          </div>

          <div className="inline-block px-4 py-1.5 rounded-full text-xs font-black mb-3"
            style={{ backgroundColor: YELLOW, color: '#1a1a1a' }}>
            🎰 QR 룰렛 이벤트
          </div>

          <h1 className="text-white text-3xl mb-1"
            style={{ fontWeight: 900, fontFamily: "'Black Han Sans', sans-serif" }}>
            행운을 돌려봐!
          </h1>
          <p className="text-gray-300 text-sm mb-4"><span className="font-black" style={{ color: YELLOW }}>{storeName}</span></p>
          <div className="flex justify-center">
            <SpinChanceBadge spinsToday={spinsToday} />
          </div>
        </div>

        {/* Wheel */}
        <div className="flex flex-col items-center mb-5">
          {isCheckingStatus ? (
            <div className="flex items-center justify-center" style={{ width: 320, height: 320 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 rounded-full"
                style={{ border: `4px solid ${GREEN}`, borderTopColor: 'transparent' }} />
            </div>
          ) : (
            <RouletteWheel rotation={rotation} isSpinning={isSpinning} />
          )}
        </div>

        {/* Prize legend */}
        <div className="grid grid-cols-2 gap-3 mb-5 w-full max-w-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,87,184,0.25)', border: '1.5px solid rgba(0,87,184,0.5)' }}>
            <span className="text-2xl">🥤</span>
            <div>
              <p className="text-white text-xs font-black">사이다 무료 증정</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10 }}>매장 제시 증정권</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 p-3 rounded-2xl"
            style={{ backgroundColor: 'rgba(239,68,68,0.2)', border: '1.5px solid rgba(239,68,68,0.5)' }}>
            <span className="text-2xl">👕</span>
            <div>
              <p className="text-white text-xs font-black">한정판 티셔츠</p>
              <p className="text-xs" style={{ color: '#FCA5A5', fontSize: 10 }}>🔥 한정 50개</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {serverError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="rounded-2xl px-4 py-3 mb-4 text-center w-full max-w-xs"
            style={{ backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-red-400 text-sm">⚠️ {serverError}</p>
          </motion.div>
        )}

        {/* Spin button / done state */}
        {isCheckingStatus ? (
          <p className="text-gray-400 text-sm">참여 현황 확인 중...</p>
        ) : !canSpin && !isSpinning ? (
          <div className="text-center w-full max-w-xs">
            <div className="rounded-2xl px-5 py-5 mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-2xl mb-2">✅</p>
              <p className="text-white font-black text-base mb-1">오늘 참여 완료!</p>
              <p className="text-gray-400 text-sm">이 매장에서의 오늘 룰렛을 이미 돌렸어요</p>
              <p className="text-gray-500 text-xs mt-1">내일 다시 도전해주세요! 🌟</p>
            </div>
            {todayResults.length > 0 && (
              <div className="space-y-2 mb-4">
                {todayResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-xl">{r.prizeEmoji}</span>
                    <div className="text-left flex-1">
                      <p className="text-white text-xs font-black">{r.prizeName}</p>
                      <p className="text-gray-500 text-xs">🎰 오늘 당첨</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-black text-white"
                      style={{ backgroundColor: r.prizeColor + 'AA' }}>받음</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={handleGoMyPage}
              className="w-full py-3.5 rounded-2xl font-black text-sm"
              style={{ backgroundColor: GREEN, color: 'white' }}>
              🎫 마이페이지에서 증정권 확인
            </button>
          </div>
        ) : (
          <motion.button onClick={handleSpin} disabled={isSpinning}
            className="relative px-12 py-4 rounded-2xl text-lg font-black shadow-2xl"
            style={{
              ...(isSpinning
                ? { background: 'linear-gradient(135deg,#444,#666)', color: '#888' }
                : { background: `linear-gradient(135deg,${YELLOW},#FFA000)`, color: '#1a1a1a', boxShadow: `0 0 24px rgba(255,215,64,0.45)` }),
              minWidth: 220,
            }}
            whileHover={!isSpinning ? { scale: 1.05, y: -3 } : {}}
            whileTap={!isSpinning ? { scale: 0.97 } : {}}
            animate={!isSpinning
              ? { boxShadow: [`0 0 0px ${YELLOW}00`, `0 0 28px ${YELLOW}90`, `0 0 0px ${YELLOW}00`] }
              : {}
            }
            transition={{ boxShadow: { duration: 2, repeat: Infinity } }}>
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>⚙️</motion.span>
                돌아가는 중...
              </span>
            ) : '🎰 참여하기!'}
          </motion.button>
        )}

        {/* How it works info */}
        {!isCheckingStatus && canSpin && (
          <div className="mt-5 w-full max-w-xs rounded-2xl overflow-hidden"
            style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="px-4 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <p className="text-xs font-black text-center" style={{ color: YELLOW }}>참여 방법</p>
            </div>
            <div className="px-4 py-3 flex items-center justify-around">
              {[
                { icon: '📍', label: '매장 방문', color: YELLOW },
                { icon: '→', label: '', color: 'rgba(255,255,255,0.2)' },
                { icon: '🎰', label: '룰렛 참여', color: GREEN },
                { icon: '→', label: '', color: 'rgba(255,255,255,0.2)' },
                { icon: '🎫', label: '증정권 받기', color: 'white' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <span style={{ fontSize: item.label ? 20 : 18, color: item.color, fontWeight: 700 }}>{item.icon}</span>
                  {item.label && <p className="text-white text-xs font-black mt-0.5" style={{ fontSize: 9 }}>{item.label}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer links */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600 text-xs">매장당 하루 1회 참여 · 데모 버전</p>
          {!loggedIn && (
            <p className="text-xs" style={{ color: '#FCD34D' }}>
              💡 증정권 저장은 로그인 후 마이페이지에서 확인
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <Link to="/" className="text-xs font-black" style={{ color: GREEN }}>← 홈으로</Link>
            {loggedIn && (
              <Link to="/mypage" className="text-xs font-black" style={{ color: YELLOW }}>내 증정권 →</Link>
            )}
          </div>
        </div>
      </div>

      {/* Prize Modal */}
      <AnimatePresence>
        {showModal && currentPrize && (
          <PrizeModal
            prize={currentPrize}
            couponId={currentCouponId}
            storeName={storeName}
            tshirtRemaining={tshirtRemaining}
            isLoggedInUser={loggedIn}
            onClose={() => setShowModal(false)}
            onGoMyPage={handleGoMyPage}
            onLoginToClaim={handleLoginToClaim}
          />
        )}
      </AnimatePresence>
    </div>
  );
}