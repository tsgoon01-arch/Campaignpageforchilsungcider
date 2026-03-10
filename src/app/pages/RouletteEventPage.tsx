import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const GREEN = '#2BAE4E';
const YELLOW = '#FFD740';
const DEVICE_ID_KEY = 'chilsung-device-id';
const PENDING_PRIZE_KEY = 'pending-roulette-prize';
const MAX_SPINS = 2;

// ── Device ID ────────────────────────────────────────────────────────────────
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
    return JSON.parse(raw)?.access_token ?? null;
  } catch { return null; }
}

function isLoggedIn(): boolean {
  return !!getAuthToken();
}

// ── Visual Roulette Segments (8칸 다양하게) ──────────────────────────────────
// 실제 경품: soda-1plus1(🥤×6칸), tshirt(👕×2칸)
const SEGMENTS = [
  { label: '사이다\n1+1', emoji: '🥤', color: '#0057B8', prizeId: 'soda-1plus1' },
  { label: '한정판\n티셔츠', emoji: '👕', color: '#EF4444', prizeId: 'tshirt' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#2BAE4E', prizeId: 'soda-1plus1' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#7C3AED', prizeId: 'soda-1plus1' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#0369A1', prizeId: 'soda-1plus1' },
  { label: '한정판\n티셔츠', emoji: '👕', color: '#B91C1C', prizeId: 'tshirt' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#059669', prizeId: 'soda-1plus1' },
  { label: '사이다\n1+1', emoji: '🥤', color: '#D97706', prizeId: 'soda-1plus1' },
];

const SEGMENT_COUNT = SEGMENTS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

// prizeId → segment indices
const PRIZE_SEGMENTS: Record<string, number[]> = {
  'soda-1plus1': [0, 2, 3, 4, 6, 7],
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

// ── Wheel Component ───────────────────────────────────────────────────────────
function RouletteWheel({ rotation, isSpinning }: { rotation: number; isSpinning: boolean }) {
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  return (
    <div className="relative select-none" style={{ width: size + 20, height: size + 20 }}>
      {/* Pointer */}
      <div className="absolute z-20" style={{
        top: -4, left: '50%', transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '14px solid transparent', borderRight: '14px solid transparent',
        borderTop: '32px solid #EF4444',
        filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
      }} />

      {/* Glow ring */}
      <div className="absolute inset-0 rounded-full" style={{
        margin: 10,
        boxShadow: isSpinning
          ? `0 0 50px 15px rgba(255,215,64,0.7), 0 0 100px 30px rgba(43,174,78,0.4)`
          : `0 0 20px 4px rgba(43,174,78,0.3)`,
        borderRadius: '50%', transition: 'box-shadow 0.4s',
      }} />

      <motion.div className="absolute" style={{ top: 10, left: 10, width: size, height: size }}
        animate={{ rotate: rotation }}
        transition={isSpinning ? { duration: 4.5, ease: [0.1, 0.9, 0.3, 1] } : { duration: 0 }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={r} fill="#0D1B2A" />
          {SEGMENTS.map((seg, i) => {
            const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const x1 = cx + r * Math.cos(startAngle);
            const y1 = cy + r * Math.sin(startAngle);
            const x2 = cx + r * Math.cos(endAngle);
            const y2 = cy + r * Math.sin(endAngle);
            const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
            const textR = r * 0.66;
            const tx = cx + textR * Math.cos(midAngle);
            const ty = cy + textR * Math.sin(midAngle);
            const textRotation = (i + 0.5) * SEGMENT_ANGLE;
            return (
              <g key={i}>
                <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                  fill={seg.color} stroke="rgba(255,255,255,0.15)" strokeWidth={2} />
                <g transform={`translate(${tx}, ${ty}) rotate(${textRotation})`}>
                  <text textAnchor="middle" dominantBaseline="middle"
                    fill="white" fontSize="15" fontWeight="800"
                    fontFamily="'Pretendard Variable', sans-serif"
                    style={{ userSelect: 'none' }}>
                    {seg.emoji}
                  </text>
                </g>
              </g>
            );
          })}
          {/* Center */}
          <circle cx={cx} cy={cy} r={30} fill="white" />
          <circle cx={cx} cy={cy} r={26} fill={GREEN} />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
            fontSize="15" fontWeight="900" fill="white">七</text>
        </svg>
      </motion.div>
    </div>
  );
}

// ── Prize Modal ───────────────────────────────────────────────────────────────
function PrizeModal({
  prize, canSpinAgain, onClose, onSpinAgain, onGoMyPage, onLoginToClaim, isLoggedInUser, tshirtRemaining
}: {
  prize: PrizeResult;
  canSpinAgain: boolean;
  onClose: () => void;
  onSpinAgain: () => void;
  onGoMyPage: () => void;
  onLoginToClaim: () => void;
  isLoggedInUser: boolean;
  tshirtRemaining: number;
}) {
  const isTshirt = prize.id === 'tshirt';

  return (
    <motion.div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-0 sm:pb-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
    >
      <motion.div
        className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {/* 당첨 배너 */}
        <div className="px-6 pt-8 pb-6 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${prize.color}, ${prize.color}cc)` }}>
          {/* Confetti dots */}
          {[...Array(6)].map((_, i) => (
            <motion.div key={i}
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{
                backgroundColor: i % 2 === 0 ? YELLOW : 'white',
                left: `${10 + i * 14}%`, top: '20%', opacity: 0.6,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 1.2, delay: i * 0.15, repeat: Infinity }}
            />
          ))}
          <motion.div
            initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 320, delay: 0.1 }}
            className="text-7xl mb-3">{prize.emoji}
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-white text-2xl" style={{ fontWeight: 900 }}>🎉 당첨!</motion.h2>
        </div>

        <div className="px-6 py-5">
          {isTshirt && (
            <div className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5' }}>
              <span className="text-sm">🔥</span>
              <p className="text-xs font-black" style={{ color: '#EF4444' }}>
                한정 {tshirtRemaining}개 남음! 정말 행운이에요!
              </p>
            </div>
          )}

          <h3 className="text-gray-900 text-lg text-center mb-1" style={{ fontWeight: 900 }}>
            {prize.name}
          </h3>
          <p className="text-gray-500 text-sm text-center mb-4">{prize.description}</p>

          {/* 로그인 여부에 따른 CTA */}
          {isLoggedInUser ? (
            <>
              <div className="rounded-xl px-4 py-3 mb-4"
                style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <p className="text-xs font-black mb-0.5" style={{ color: GREEN }}>✅ 교환권이 마이페이지에 발급되었어요!</p>
                <p className="text-xs text-gray-500">마이페이지 → 내 교환권에서 사용할 수 있어요.</p>
              </div>
              <button onClick={onGoMyPage}
                className="w-full py-3.5 rounded-2xl text-white font-black mb-2.5 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: GREEN, fontSize: '15px' }}>
                🎫 마이페이지에서 교환권 확인
              </button>
              {canSpinAgain ? (
                <button onClick={onSpinAgain}
                  className="w-full py-3 rounded-2xl font-black border-2 text-sm"
                  style={{ borderColor: YELLOW, color: '#92400E', backgroundColor: '#FFFBEB' }}>
                  🎰 한 번 더 돌리기! ({MAX_SPINS - 1}회 남음)
                </button>
              ) : (
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl font-black border-2 text-sm text-gray-500"
                  style={{ borderColor: '#E5E7EB' }}>
                  오늘의 참여 완료 · 내일 또 도전해요!
                </button>
              )}
            </>
          ) : (
            <>
              <div className="rounded-xl px-4 py-3 mb-4"
                style={{ backgroundColor: '#FFFBEB', border: '1px solid #FCD34D' }}>
                <p className="text-xs font-black mb-0.5" style={{ color: '#92400E' }}>⚠️ 교환권 발급을 위해 로그인이 필요해요</p>
                <p className="text-xs text-gray-500">로그인하면 교환권이 즉시 마이페이지에 등록됩니다.</p>
              </div>
              <button onClick={onLoginToClaim}
                className="w-full py-3.5 rounded-2xl text-white font-black mb-2.5 hover:opacity-90 transition-opacity"
                style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)`, fontSize: '15px' }}>
                🔐 로그인하고 교환권 받기
              </button>
              {canSpinAgain ? (
                <button onClick={onSpinAgain}
                  className="w-full py-3 rounded-2xl font-black border-2 text-sm"
                  style={{ borderColor: YELLOW, color: '#92400E', backgroundColor: '#FFFBEB' }}>
                  🎰 한 번 더 돌리기!
                </button>
              ) : (
                <button onClick={onClose}
                  className="w-full py-3 rounded-2xl font-black border-2 text-sm text-gray-500"
                  style={{ borderColor: '#E5E7EB' }}>
                  닫기
                </button>
              )}
            </>
          )}
          <p className="text-center text-xs text-gray-400 mt-3">* 데모 환경: 실제 경품 미지급</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Spin Count Badge ──────────────────────────────────────────────────────────
function SpinCountBadge({ spinsToday, maxSpins }: { spinsToday: number; maxSpins: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[...Array(maxSpins)].map((_, i) => (
        <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black border-2"
          style={{
            backgroundColor: i < spinsToday ? 'rgba(255,255,255,0.15)' : 'rgba(255,215,64,0.2)',
            borderColor: i < spinsToday ? 'rgba(255,255,255,0.25)' : YELLOW,
            color: i < spinsToday ? 'rgba(255,255,255,0.4)' : YELLOW,
          }}>
          {i < spinsToday ? '✓' : i + 1}
        </div>
      ))}
      <span className="text-xs ml-1" style={{ color: spinsToday < maxSpins ? YELLOW : 'rgba(255,255,255,0.5)' }}>
        {spinsToday < maxSpins ? `${maxSpins - spinsToday}회 남음` : '완료'}
      </span>
    </div>
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
  const [tshirtRemaining, setTshirtRemaining] = useState(50);
  const [spinsToday, setSpinsToday] = useState(0);
  const [canSpin, setCanSpin] = useState(true);
  const [todayResults, setTodayResults] = useState<SpinRecord[]>([]);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [serverError, setServerError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [canSpinAgain, setCanSpinAgain] = useState(false);
  const [pendingPrize, setPendingPrize] = useState<object | null>(null);

  const deviceId = getOrCreateDeviceId();
  const authToken = getAuthToken();
  const loggedIn = isLoggedIn();

  // ── On mount: fetch stock + check status ───────────────────────────────────
  useEffect(() => {
    fetch(`${SERVER_URL}/roulette/stock`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
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
    } catch (err) {
      console.error(err);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  // ── Spin ──────────────────────────────────────────────────────────────────
  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;
    setIsSpinning(true);
    setServerError('');
    setShowModal(false);

    try {
      const res = await fetch(`${SERVER_URL}/roulette/spin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken || publicAnonKey}`,
        },
        body: JSON.stringify({ storeId, storeName, deviceId }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setServerError(data.error || '룰렛 오류가 발생했습니다.');
        setIsSpinning(false);
        if (data.spinsToday !== undefined) {
          setSpinsToday(data.spinsToday);
          setCanSpin(data.spinsToday < MAX_SPINS);
        }
        return;
      }

      const wonPrize: PrizeResult = data.prize;
      if (data.tshirt_remaining !== undefined) setTshirtRemaining(data.tshirt_remaining);

      // Determine target segment (pick random segment matching the prize)
      const possibleSegments = PRIZE_SEGMENTS[wonPrize.id] ?? [0];
      const targetSegment = possibleSegments[Math.floor(Math.random() * possibleSegments.length)];
      const targetAngle = 360 - (targetSegment * SEGMENT_ANGLE + SEGMENT_ANGLE / 2);
      const fullSpins = 5 + Math.floor(Math.random() * 4);
      const totalRotation = rotation + fullSpins * 360 + targetAngle - (rotation % 360);

      setRotation(totalRotation);
      setCurrentPrize(wonPrize);

      const newSpinsToday = data.spinsToday || spinsToday + 1;
      const newCanSpinAgain = data.canSpinAgain === true;

      // If not logged in, save pending prize to sessionStorage
      if (!loggedIn && data.couponId) {
        const pending = {
          prizeId: wonPrize.id,
          prizeName: wonPrize.name,
          prizeEmoji: wonPrize.emoji,
          prizeColor: wonPrize.color,
          storeId, storeName,
          couponId: data.couponId,
          timestamp: new Date().toISOString(),
        };
        setPendingPrize(pending);
        // Store in sessionStorage for login flow
        const stored = JSON.parse(sessionStorage.getItem(PENDING_PRIZE_KEY) || '[]');
        stored.push(pending);
        sessionStorage.setItem(PENDING_PRIZE_KEY, JSON.stringify(stored));
      }

      setTimeout(() => {
        setIsSpinning(false);
        setSpinsToday(newSpinsToday);
        setCanSpin(newCanSpinAgain);
        setCanSpinAgain(newCanSpinAgain);
        setShowModal(true);
        checkDailyStatus(); // refresh state
      }, 4800);
    } catch (err) {
      console.error('Spin error:', err);
      setServerError(`네트워크 오류: ${err}`);
      setIsSpinning(false);
    }
  };

  const handleSpinAgain = () => {
    setShowModal(false);
    setCurrentPrize(null);
    // Small delay then spin
    setTimeout(() => handleSpin(), 400);
  };

  const handleGoMyPage = () => {
    navigate('/mypage');
  };

  const handleLoginToClaim = () => {
    // pending prizes already saved to sessionStorage above
    navigate(`/login?return=/mypage&claim=1`);
  };

  return (
    <div className="min-h-screen flex flex-col relative" style={{
      background: 'linear-gradient(160deg, #0D1B2A 0%, #1a2744 45%, #0D1B2A 100%)',
      overflow: 'hidden',
    }}>
      {/* Animated BG */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(14)].map((_, i) => (
          <motion.div key={i} className="absolute rounded-full"
            style={{
              width: 20 + (i * 7) % 80,
              height: 20 + (i * 7) % 80,
              backgroundColor: i % 3 === 0 ? GREEN : i % 3 === 1 ? YELLOW : '#fff',
              left: `${(i * 13) % 100}%`,
              top: `${(i * 17) % 100}%`,
              opacity: 0.06,
            }}
            animate={{ y: [0, -24, 0], opacity: [0.04, 0.12, 0.04] }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center min-h-screen px-4 py-8">
        {/* Header */}
        <div className="text-center mb-5 w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}>
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
          <p className="text-gray-300 text-sm mb-4">
            <span className="font-black" style={{ color: YELLOW }}>{storeName}</span> 방문 기념
          </p>

          {/* Spin count + stock */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <SpinCountBadge spinsToday={spinsToday} maxSpins={MAX_SPINS} />
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

        {/* Prize Legend */}
        <div className="grid grid-cols-2 gap-3 mb-5 w-full max-w-xs">
          {/* 사이다 1+1 */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl"
            style={{ backgroundColor: 'rgba(0,87,184,0.25)', border: '1.5px solid rgba(0,87,184,0.5)' }}>
            <span className="text-2xl">🥤</span>
            <div>
              <p className="text-white text-xs font-black">사이다 1+1</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>편의점 교환권</p>
            </div>
          </div>
          {/* 한정판 티셔츠 */}
          <div className="flex items-center gap-2.5 p-3 rounded-2xl"
            style={{ backgroundColor: 'rgba(239,68,68,0.2)', border: '1.5px solid rgba(239,68,68,0.5)' }}>
            <span className="text-2xl">👕</span>
            <div>
              <p className="text-white text-xs font-black">한정판 티셔츠</p>
              <p className="text-xs" style={{ color: '#FCA5A5', fontSize: '10px' }}>🔥 한정 50개</p>
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

        {/* Spin Button / Status */}
        {isCheckingStatus ? (
          <p className="text-gray-400 text-sm">참여 현황 확인 중...</p>
        ) : !canSpin && !isSpinning ? (
          <div className="text-center w-full max-w-xs">
            <div className="rounded-2xl px-5 py-5 mb-4"
              style={{ backgroundColor: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}>
              <p className="text-2xl mb-2">✅</p>
              <p className="text-white font-black text-base mb-1">오늘 참여 완료!</p>
              <p className="text-gray-400 text-sm">하루 최대 {MAX_SPINS}번 참여 가능해요.</p>
              <p className="text-gray-500 text-xs mt-1">내일 다시 도전해주세요! 🌟</p>
            </div>

            {/* Today's results summary */}
            {todayResults.length > 0 && (
              <div className="space-y-2 mb-4">
                {todayResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span className="text-xl">{r.prizeEmoji}</span>
                    <div className="text-left">
                      <p className="text-white text-xs font-black">{r.prizeName}</p>
                      <p className="text-gray-500 text-xs">{i + 1}번째 참여</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleGoMyPage}
              className="w-full py-3.5 rounded-2xl font-black text-sm"
              style={{ backgroundColor: GREEN, color: 'white' }}>
              🎫 마이페이지에서 교환권 확인
            </button>
          </div>
        ) : (
          <motion.button onClick={handleSpin} disabled={isSpinning}
            className="relative px-12 py-4 rounded-2xl text-lg font-black shadow-2xl"
            style={{
              background: isSpinning
                ? 'linear-gradient(135deg, #444, #666)'
                : `linear-gradient(135deg, ${YELLOW}, #FFA000)`,
              color: isSpinning ? '#888' : '#1a1a1a',
              minWidth: 220,
            }}
            whileHover={!isSpinning ? { scale: 1.05, y: -3 } : {}}
            whileTap={!isSpinning ? { scale: 0.97 } : {}}
            animate={!isSpinning ? { boxShadow: [`0 0 0px ${YELLOW}00`, `0 0 24px ${YELLOW}80`, `0 0 0px ${YELLOW}00`] } : {}}
            transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
          >
            {isSpinning ? (
              <span className="flex items-center gap-2">
                <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}>⚙️</motion.span>
                돌아가는 중...
              </span>
            ) : `🎰 룰렛 돌리기! (${MAX_SPINS - spinsToday}회 남음)`}
          </motion.button>
        )}

        {/* Info footer */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-gray-600 text-xs">
            매장 방문당 하루 최대 {MAX_SPINS}번 · 데모 버전 (실제 경품 미지급)
          </p>
          {!loggedIn && (
            <p className="text-xs" style={{ color: '#FCD34D' }}>
              💡 교환권 발급은 로그인 후 마이페이지에서 확인해주세요
            </p>
          )}
          <div className="flex items-center justify-center gap-4">
            <Link to="/" className="text-xs font-black" style={{ color: GREEN }}>← 홈으로</Link>
            {loggedIn && (
              <Link to="/mypage" className="text-xs font-black" style={{ color: YELLOW }}>내 교환권 →</Link>
            )}
          </div>
        </div>
      </div>

      {/* Prize Modal */}
      <AnimatePresence>
        {showModal && currentPrize && (
          <PrizeModal
            prize={currentPrize}
            canSpinAgain={canSpinAgain}
            onClose={() => setShowModal(false)}
            onSpinAgain={handleSpinAgain}
            onGoMyPage={handleGoMyPage}
            onLoginToClaim={handleLoginToClaim}
            isLoggedInUser={loggedIn}
            tshirtRemaining={tshirtRemaining}
          />
        )}
      </AnimatePresence>
    </div>
  );
}