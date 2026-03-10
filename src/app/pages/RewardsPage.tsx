import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Stamp, RefreshCw, CheckCircle2, X, Store, Gift, Send, Ticket, Trophy } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAuth } from '../context/AuthContext';
import { useStamp } from '../context/StampContext';
import { prizes } from '../data/prizes';
import { stores } from '../data/stores';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const GREEN = '#2BAE4E';
const YELLOW = '#FFD740';
const DEVICE_ID_KEY = 'chilsung-device-id';
const LOTTERY_KEY = 'chilsung-lottery-entries';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function shortCode(id: string) {
  return id.replace(/-/g, '').slice(-8).toUpperCase();
}

// ── Lottery entry helpers (local storage based for demo) ──────────────────────
interface LotteryEntry {
  prizeId: string;
  appliedAt: string;
  usedAt: string | null;
  userName: string;
  userEmail: string;
  stampCount: number;
}

function loadLotteryEntries(): LotteryEntry[] {
  try { return JSON.parse(localStorage.getItem(LOTTERY_KEY) || '[]'); }
  catch { return []; }
}

function saveLotteryEntries(entries: LotteryEntry[]) {
  localStorage.setItem(LOTTERY_KEY, JSON.stringify(entries));
}

// ── Coupon & SpinHistory interfaces ───────────────────────────────────────────
interface Coupon {
  couponId: string;
  prizeId: string;
  prizeName: string;
  prizeEmoji: string;
  prizeColor: string;
  storeId: string;
  storeName: string;
  isUsed: boolean;
  issuedAt: string;
  usedAt: string | null;
}

interface SpinHistory {
  storeId: string;
  storeName: string;
  prizeId: string;
  prizeName: string;
  prizeEmoji: string;
  prizeColor: string;
  timestamp: string;
}

// ── Voucher Modal ─────────────────────────────────────────────────────────────
function VoucherModal({
  coupon, onClose, onMarkUsed, isMarkingUsed,
}: {
  coupon: Coupon;
  onClose: () => void;
  onMarkUsed: () => void;
  isMarkingUsed: boolean;
}) {
  const [confirmUsed, setConfirmUsed] = useState(false);
  const color = coupon.prizeColor || GREEN;
  const code = shortCode(coupon.couponId);
  const expiryDate = new Date(new Date(coupon.issuedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = new Date() > expiryDate;

  const bars = Array.from({ length: 28 }, (_, i) => ({
    width: [2, 3, 1, 2, 1, 3, 2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3, 1, 2, 1][i % 28],
    height: 40 + (i % 3) * 8,
  }));

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-xs overflow-hidden"
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>

        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <X size={14} />
        </button>

        <div className="py-6 px-5 text-center relative overflow-hidden"
          style={{ background: coupon.isUsed ? '#9CA3AF' : `linear-gradient(135deg,${color},${color}CC)` }}>
          {!coupon.isUsed && (
            <motion.div className="absolute top-0 -left-full w-1/2 h-full"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)' }}
              animate={{ left: ['-100%', '200%'] }} transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }} />
          )}
          <div className="text-6xl mb-2" style={{ filter: coupon.isUsed ? 'grayscale(1)' : 'none' }}>
            {coupon.prizeEmoji}
          </div>
          <p className="text-white/70 text-xs font-black tracking-widest mb-0.5">매장 증정권</p>
          <h2 className="text-white font-black text-lg leading-tight">{coupon.prizeName}</h2>

          {coupon.isUsed && (
            <div className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <div className="rotate-[-20deg] border-4 border-white rounded-xl px-5 py-2">
                <p className="text-white font-black text-2xl tracking-widest">사용완료</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center bg-gray-100 px-0">
          <div className="w-5 h-5 rounded-full bg-white -ml-2.5 border border-gray-200" />
          <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2" />
          <div className="w-5 h-5 rounded-full bg-white -mr-2.5 border border-gray-200" />
        </div>

        <div className="px-5 py-5">
          <div className="space-y-2 mb-4">
            {[
              { label: '발급 매장', value: coupon.storeName },
              { label: '발급 일시', value: new Date(coupon.issuedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) },
              { label: '유효 기간', value: coupon.isUsed ? '사용 완료' : isExpired ? '만료됨' : `~${expiryDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-sm">
                <span className="text-gray-400 text-xs">{row.label}</span>
                <span className="text-gray-800 font-black text-xs">{row.value}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-3 mb-4 text-center"
            style={{ backgroundColor: '#F9FAFB', border: '1.5px solid #F3F4F6' }}>
            <div className="flex items-end justify-center gap-0.5 mb-2" style={{ height: 52 }}>
              {bars.map((bar, i) => (
                <div key={i}
                  style={{
                    width: bar.width,
                    height: bar.height,
                    backgroundColor: coupon.isUsed ? '#D1D5DB' : '#1A1A1A',
                    borderRadius: 1,
                  }} />
              ))}
            </div>
            <p className="font-black text-lg tracking-[0.3em]" style={{ color: coupon.isUsed ? '#9CA3AF' : '#1A1A1A' }}>
              {code}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">매장 직원에게 이 화면을 보여주세요</p>
          </div>

          {!coupon.isUsed && !isExpired && (
            <div className="rounded-xl px-3 py-2.5 mb-4"
              style={{ backgroundColor: color + '10', border: `1.5px solid ${color}30` }}>
              <p className="text-xs font-black mb-0.5" style={{ color }}>사용 방법</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                이 화면을 매장 직원에게 보여주시면 {coupon.prizeName.replace('증정권', '')}을 받으실 수 있어요.
                수령 후 아래 "사용 완료 처리" 버튼을 눌러 주세요.
              </p>
            </div>
          )}

          {coupon.isUsed && coupon.usedAt && (
            <div className="rounded-xl px-3 py-2.5 mb-4"
              style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
              <p className="text-xs font-black mb-0.5" style={{ color: GREEN }}>사용 완료</p>
              <p className="text-xs text-gray-500">
                {new Date(coupon.usedAt).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}에 사용 처리되었어요.
              </p>
            </div>
          )}

          {!coupon.isUsed && !isExpired && (
            !confirmUsed ? (
              <button onClick={() => setConfirmUsed(true)}
                className="w-full py-3 rounded-2xl font-black text-sm border-2 flex items-center justify-center gap-2"
                style={{ borderColor: GREEN, color: GREEN }}>
                <CheckCircle2 size={15} /> 사용 완료 처리
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 text-center">매장에서 상품을 받으셨나요?</p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmUsed(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 border-gray-200 text-gray-500">
                    취소
                  </button>
                  <motion.button onClick={onMarkUsed} disabled={isMarkingUsed}
                    whileTap={{ scale: 0.97 }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1"
                    style={{ backgroundColor: GREEN }}>
                    {isMarkingUsed
                      ? <><RefreshCw size={11} className="animate-spin" /> 처리 중...</>
                      : <><CheckCircle2 size={11} /> 네, 받았어요!</>}
                  </motion.button>
                </div>
              </div>
            )
          )}

          {(coupon.isUsed || isExpired) && (
            <button onClick={onClose}
              className="w-full py-3 rounded-2xl text-sm font-black border-2 border-gray-200 text-gray-400">
              닫기
            </button>
          )}
        </div>
        <p className="text-center text-xs text-gray-300 pb-4">* 데모 환경 · 실제 경품 미지급</p>
      </motion.div>
    </motion.div>
  );
}

// ── Coupon Card ────────────────────────────────────────────────────────────────
function CouponCard({
  coupon, onMarkUsed, isUsing,
}: {
  coupon: Coupon;
  onMarkUsed: (couponId: string) => void;
  isUsing: boolean;
}) {
  const [showVoucher, setShowVoucher] = useState(false);
  const color = coupon.prizeColor || GREEN;
  const expiryDate = new Date(new Date(coupon.issuedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = new Date() > expiryDate;
  const code = shortCode(coupon.couponId);

  const handleMarkUsed = async () => {
    onMarkUsed(coupon.couponId);
    setShowVoucher(false);
  };

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: coupon.isUsed ? 0.6 : 1, y: 0 }}
        className="relative bg-white rounded-3xl overflow-hidden"
        style={{
          border: `2px solid ${coupon.isUsed ? '#E5E7EB' : color + '50'}`,
          boxShadow: coupon.isUsed ? 'none' : `0 2px 0 ${color}20`,
        }}>
        {coupon.isUsed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="rotate-[-18deg] border-4 rounded-xl px-5 py-1.5"
              style={{ borderColor: '#9CA3AF40', color: '#9CA3AF', fontSize: 22, fontWeight: 900, opacity: 0.3, letterSpacing: '3px' }}>
              사용완료
            </div>
          </div>
        )}
        <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl"
          style={{ backgroundColor: coupon.isUsed ? '#E5E7EB' : color }} />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 w-5 h-5 rounded-full border-2"
          style={{ borderColor: coupon.isUsed ? '#E5E7EB' : color + '30', backgroundColor: '#F8FAFF' }} />
        <div className="pl-6 pr-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: color + '15', border: `1.5px solid ${color}20` }}>
              {coupon.prizeEmoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-black"
                  style={{ backgroundColor: coupon.isUsed ? '#F3F4F6' : color + '15', color: coupon.isUsed ? '#9CA3AF' : color }}>
                  {coupon.isUsed ? '사용완료' : '🎫 매장 증정권'}
                </span>
                {!coupon.isUsed && isExpired && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-black bg-red-50 text-red-400">만료</span>
                )}
              </div>
              <h3 className="font-black text-gray-900 text-sm leading-tight">{coupon.prizeName}</h3>
              <p className="text-xs text-gray-400 mt-0.5 truncate">
                <Store size={9} className="inline mr-1" />{coupon.storeName}
              </p>
            </div>
          </div>
          <div className="border-t-2 border-dashed my-3" style={{ borderColor: color + '20' }} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-gray-400 font-mono tracking-widest">{code}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {coupon.isUsed && coupon.usedAt
                  ? `사용: ${new Date(coupon.usedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`
                  : isExpired ? '만료됨'
                  : `~${expiryDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 까지`}
              </p>
            </div>
            {!coupon.isUsed && !isExpired ? (
              <motion.button
                onClick={() => setShowVoucher(true)}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="px-4 py-2.5 rounded-2xl text-white font-black text-xs flex items-center gap-1.5 shrink-0"
                style={{ background: `linear-gradient(135deg,${color},${color}CC)` }}>
                <Store size={12} /> 매장 제시하기
              </motion.button>
            ) : coupon.isUsed ? (
              <button onClick={() => setShowVoucher(true)}
                className="px-3 py-2 rounded-xl text-xs font-black border border-gray-200 text-gray-400">
                상세 보기
              </button>
            ) : null}
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showVoucher && (
          <VoucherModal
            coupon={coupon}
            onClose={() => setShowVoucher(false)}
            onMarkUsed={handleMarkUsed}
            isMarkingUsed={isUsing}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Lottery Apply Modal ───────────────────────────────────────────────────────
function LotteryApplyModal({
  prize, userName, userEmail, stampCount, onClose, onApply,
}: {
  prize: typeof prizes[0];
  userName: string;
  userEmail: string;
  stampCount: number;
  onClose: () => void;
  onApply: () => void;
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [done, setDone] = useState(false);

  const handleApply = () => {
    onApply();
    setDone(true);
  };

  // 방문한 매장 목록 (응모 시 업체에 전달되는 정보)
  const visitedStores = stores.filter((_, i) => i < stampCount).slice(0, prize.checkinsRequired);

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}>
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
        initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}>

        <button onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
          <X size={14} />
        </button>

        {/* Header */}
        <div className="py-6 px-5 text-center"
          style={{ background: `linear-gradient(135deg,${prize.themeColor},${prize.themeColor}CC)` }}>
          <div className="text-5xl mb-2">{prize.emoji}</div>
          <p className="text-white/70 text-xs font-black tracking-widest mb-0.5">스탬프 응모권</p>
          <h2 className="text-white font-black text-lg leading-tight">{prize.title}</h2>
        </div>

        <div className="px-5 py-5">
          {!done ? (
            <>
              {/* Info to be sent */}
              <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#F8FAFF', border: '1.5px solid #E8EEFF' }}>
                <p className="text-xs font-black text-gray-700 mb-2 flex items-center gap-1.5">
                  <Send size={12} /> 응모 시 전달되는 정보
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: '이름', value: userName },
                    { label: '이메일', value: userEmail },
                    { label: '스탬프 수', value: `${stampCount}개` },
                    { label: '방문 매장', value: visitedStores.map(s => s.name).join(', ') || '-' },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-gray-400">{row.label}</span>
                      <span className="text-gray-700 font-black text-right max-w-[60%] truncate">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl px-3 py-2.5 mb-4"
                style={{ backgroundColor: prize.themeColor + '10', border: `1.5px solid ${prize.themeColor}30` }}>
                <p className="text-xs font-black mb-0.5" style={{ color: prize.themeColor }}>응모 안내</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {prize.description}<br />
                  응모 시 위 정보가 캠페인 운영팀 및 참여 매장에 전달됩니다.
                </p>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setConfirmed(!confirmed)}
                  className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                  style={{ borderColor: confirmed ? GREEN : '#D1D5DB', backgroundColor: confirmed ? GREEN : 'white' }}>
                  {confirmed && <CheckCircle2 size={12} color="white" />}
                </button>
                <p className="text-xs text-gray-500">위 정보 전달에 동의합니다 (필수)</p>
              </div>

              <div className="flex gap-2">
                <button onClick={onClose}
                  className="flex-1 py-3 rounded-2xl text-sm font-black border-2 border-gray-200 text-gray-500">
                  취소
                </button>
                <motion.button
                  onClick={handleApply}
                  disabled={!confirmed}
                  whileTap={{ scale: 0.97 }}
                  className="flex-1 py-3 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ backgroundColor: prize.themeColor }}>
                  <Ticket size={14} /> 응모하기
                </motion.button>
              </div>
            </>
          ) : (
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="py-4 text-center">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}
                className="text-5xl mb-3">{prize.emoji}</motion.div>
              <p className="font-black text-xl text-gray-900 mb-1">응모 완료!</p>
              <p className="text-sm text-gray-500 mb-2">{prize.title} 추첨에 등록되었어요</p>
              <p className="text-xs text-gray-400 mb-5">
                캠페인 종료 후 당첨자에게 개별 연락드립니다.
              </p>
              <button onClick={onClose}
                className="w-full py-3 rounded-2xl text-white font-black text-sm"
                style={{ backgroundColor: prize.themeColor }}>
                확인
              </button>
            </motion.div>
          )}
        </div>
        <p className="text-center text-xs text-gray-300 pb-4">* 데모 환경 · 실제 경품 미지급</p>
      </motion.div>
    </motion.div>
  );
}

// ── Rewards Page ──────────────────────────────────────────────────────────────
export function RewardsPage() {
  const { user, signOut, accessToken } = useAuth();
  const { stampCount, collectedStamps } = useStamp();
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [spinHistory, setSpinHistory] = useState<SpinHistory[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [usingCouponId, setUsingCouponId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coupons' | 'lottery' | 'history'>('coupons');
  const [newCouponAlert, setNewCouponAlert] = useState(false);
  const [lotteryEntries, setLotteryEntries] = useState<LotteryEntry[]>(loadLotteryEntries());
  const [applyingPrize, setApplyingPrize] = useState<typeof prizes[0] | null>(null);

  const isGuest = !user;
  const deviceId = getDeviceId();
  const unusedCount = coupons.filter((c) => !c.isUsed).length;
  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '사용자';
  const displayEmail = user?.email || 'demo@chilsung.kr';

  const loadCoupons = useCallback(async () => {
    if (!accessToken) {
      setIsLoadingCoupons(false);
      return;
    }
    setIsLoadingCoupons(true);
    try {
      const res = await fetch(`${SERVER_URL}/roulette/coupons`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.status === 401) {
        signOut();
        navigate('/login');
        return;
      }
      const d = await res.json();
      setCoupons(d.coupons || []);
    } catch (err) { console.error('Failed to load coupons:', err); }
    finally { setIsLoadingCoupons(false); }
  }, [accessToken]);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({ deviceId });
      const res = await fetch(`${SERVER_URL}/roulette/history?${params}`, {
        headers: { Authorization: `Bearer ${publicAnonKey}` },
      });
      if (!res.ok) {
        setSpinHistory([]);
        return;
      }
      const d = await res.json();
      setSpinHistory(d.history || []);
    } catch (err) { console.error('Failed to load history:', err); }
    finally { setIsLoadingHistory(false); }
  }, [deviceId]);

  useEffect(() => {
    loadCoupons();
    loadHistory();
  }, [loadCoupons, loadHistory]);

  useEffect(() => {
    if (coupons.length > 0) {
      const hasRecent = coupons.some((c) => (Date.now() - new Date(c.issuedAt).getTime()) < 60000);
      if (hasRecent) setNewCouponAlert(true);
    }
  }, [coupons]);

  const handleUseCoupon = async (couponId: string) => {
    if (!accessToken) return;
    setUsingCouponId(couponId);
    try {
      const res = await fetch(`${SERVER_URL}/roulette/coupon/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ couponId }),
      });
      if (res.status === 401) {
        signOut();
        navigate('/login');
        return;
      }
      const d = await res.json();
      if (d.coupon) {
        setCoupons((prev) => prev.map((c) => c.couponId === couponId ? d.coupon : c));
      }
    } catch (err) { console.error('Failed to use coupon:', err); }
    finally { setUsingCouponId(null); }
  };

  const handleLotteryApply = (prizeId: string) => {
    const newEntry: LotteryEntry = {
      prizeId,
      appliedAt: new Date().toISOString(),
      usedAt: null,
      userName: displayName,
      userEmail: displayEmail,
      stampCount,
    };
    const updated = [...lotteryEntries, newEntry];
    setLotteryEntries(updated);
    saveLotteryEntries(updated);
  };

  const isLotteryApplied = (prizeId: string) => lotteryEntries.some(e => e.prizeId === prizeId);

  const nextMilestone = [4, 7, 10].find((n) => n > stampCount) ?? 10;

  return (
    <div style={{ backgroundColor: '#F8FAFF', minHeight: '100vh' }}>

      {/* Header */}
      <div className="text-white py-8 px-4" style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFA000)` }}>
        <div className="max-w-2xl mx-auto">
          <p className="text-amber-800 text-sm font-black mb-2">내 리워드</p>
          <h1 className="text-2xl font-black text-gray-900 mb-1">증정권 & 응모권 관리</h1>
          <p className="text-amber-700 text-sm">룰렛 증정권, 스탬프 응모권, 참여 기록을 한눈에</p>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { label: '스탬프', value: stampCount, suffix: '/10', color: '#1a1a1a' },
              { label: '미사용 증정권', value: unusedCount, suffix: '개', color: unusedCount > 0 ? '#EF4444' : '#1a1a1a' },
              { label: '응모 완료', value: lotteryEntries.length, suffix: '건', color: lotteryEntries.length > 0 ? GREEN : '#1a1a1a' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-2.5 text-center"
                style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
                <p className="text-xl font-black" style={{ color: stat.color }}>
                  {stat.value}<span className="text-xs ml-0.5 opacity-70">{stat.suffix}</span>
                </p>
                <p className="text-amber-800 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New coupon alert */}
      <AnimatePresence>
        {newCouponAlert && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
            style={{ backgroundColor: GREEN }}>
            <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
              <p className="text-sm font-black text-white">🎫 새 증정권이 발급되었어요!</p>
              <button onClick={() => setNewCouponAlert(false)} className="text-xs font-black text-white/50 hover:text-white">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* Stamp progress */}
        <div className="bg-white rounded-2xl p-4 mb-4 border-2" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-gray-700">🎯 다음 리워드까지</p>
            <span className="text-xs font-black" style={{ color: GREEN }}>{stampCount}/{nextMilestone}</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${GREEN}, #00C853)` }}
              initial={{ width: 0 }}
              animate={{ width: `${(stampCount / nextMilestone) * 100}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            {nextMilestone === 4 && `${4 - stampCount}개 더 모으면 👕 티셔츠 추첨 응모!`}
            {nextMilestone === 7 && `${7 - stampCount}개 더 모으면 🚂 코레일 여행권!`}
            {nextMilestone === 10 && `${10 - stampCount}개 더 모으면 전체 리워드 달성!`}
          </p>
        </div>

        {/* Guest prompt */}
        {isGuest && (
          <div className="bg-white rounded-3xl shadow-sm border-2 p-5 mb-4" style={{ borderColor: '#F3F4F6' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🔐</span>
              <div className="flex-1">
                <p className="font-black text-sm text-gray-900 mb-1">로그인하고 증정권을 받으세요!</p>
                <p className="text-xs text-gray-500 mb-3">룰렛 증정권 저장 · 스탬프 영구 보관 · 응모권 관리</p>
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1 py-2.5 text-center rounded-xl text-white text-sm font-black hover:opacity-90"
                    style={{ backgroundColor: GREEN }}>로그인</Link>
                  <Link to="/signup" className="flex-1 py-2.5 text-center rounded-xl text-sm font-black border-2 border-gray-200 text-gray-700 hover:bg-gray-50">회원가입</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Nav — 3 tabs */}
        <div className="flex gap-1 mb-4 p-1.5 bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#F3F4F6' }}>
          {([
            { key: 'coupons' as const, label: '증정권', icon: '🎫', badge: unusedCount > 0 ? unusedCount : null },
            { key: 'lottery' as const, label: '응모권', icon: '🏆', badge: lotteryEntries.length > 0 ? lotteryEntries.length : null },
            { key: 'history' as const, label: '룰렛 이력', icon: '🎰', badge: null },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-black transition-all relative"
              style={activeTab === tab.key ? { backgroundColor: GREEN, color: 'white' } : { color: '#6B7280' }}>
              {tab.icon} {tab.label}
              {tab.badge !== null && (
                <span className="absolute -top-1 -right-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: '#EF4444', fontSize: '9px', fontWeight: 900, minWidth: '18px', height: '18px' }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ═══ Tab: Coupons (룰렛 증정권) ═══ */}
        {activeTab === 'coupons' && (
          <div>
            {!user ? (
              <div className="bg-white rounded-3xl p-8 text-center border-2" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-4xl mb-3">🔐</p>
                <p className="font-black text-gray-700 mb-1">로그인이 필요해요</p>
                <p className="text-xs text-gray-400 mb-4">증정권은 로그인 후 발급됩니다</p>
                <Link to="/login"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90"
                  style={{ backgroundColor: GREEN }}>로그인하기</Link>
              </div>
            ) : isLoadingCoupons ? (
              <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-full"
                  style={{ border: `3px solid ${GREEN}`, borderTopColor: 'transparent' }} />
              </div>
            ) : coupons.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border-2" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-5xl mb-3">🎫</p>
                <p className="font-black text-gray-700 mb-1">아직 증정권이 없어요</p>
                <p className="text-xs text-gray-400 mb-5">매장에서 룰렛에 참여해보세요!</p>
                <Link to="/map"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90"
                  style={{ backgroundColor: GREEN }}>
                  <MapPin size={14} /> 매장 찾기
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
                  style={{ backgroundColor: '#FFF9E6', border: '1.5px solid #FCD34D' }}>
                  <span className="text-lg shrink-0">💡</span>
                  <div>
                    <p className="font-black text-xs mb-0.5" style={{ color: '#92400E' }}>매장 증정권 사용 방법</p>
                    <p className="text-xs leading-relaxed" style={{ color: '#B45309' }}>
                      "매장 제시하기" 버튼을 눌러 증정권 화면을 매장 직원에게 보여주세요.<br />
                      수령 후 반드시 "사용 완료 처리"를 눌러주세요.
                    </p>
                  </div>
                </div>

                {coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.couponId}
                    coupon={coupon}
                    onMarkUsed={handleUseCoupon}
                    isUsing={usingCouponId === coupon.couponId}
                  />
                ))}

                <p className="text-center text-xs text-gray-400 pt-1">
                  총 {coupons.length}개 · 미사용 {unusedCount}개
                </p>

                <button onClick={loadCoupons} disabled={isLoadingCoupons}
                  className="w-full py-2.5 rounded-xl border-2 text-xs font-black text-gray-500 flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#E5E7EB' }}>
                  <RefreshCw size={12} className={isLoadingCoupons ? 'animate-spin' : ''} /> 새로고침
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Tab: Lottery (스탬프 응모권) ═══ */}
        {activeTab === 'lottery' && (
          <div className="space-y-4">
            {/* Guide */}
            <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
              style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE' }}>
              <span className="text-lg shrink-0">🎟️</span>
              <div>
                <p className="font-black text-xs mb-0.5" style={{ color: '#1E40AF' }}>스탬프 응모권 안내</p>
                <p className="text-xs leading-relaxed" style={{ color: '#3B82F6' }}>
                  스탬프를 모아 달성한 리워드 티어별로 응모할 수 있어요.<br />
                  응모 시 참여 매장에 사용자 정보가 전달됩니다.
                </p>
              </div>
            </div>

            {/* Prize cards */}
            {prizes.map((prize) => {
              const reached = stampCount >= prize.checkinsRequired;
              const applied = isLotteryApplied(prize.id);
              const entry = lotteryEntries.find(e => e.prizeId === prize.id);

              return (
                <motion.div key={prize.id} layout
                  className="bg-white rounded-3xl overflow-hidden border-2 transition-all"
                  style={{
                    borderColor: applied ? `${prize.themeColor}60` : reached ? prize.themeColor : '#F3F4F6',
                    opacity: reached ? 1 : 0.65,
                  }}>

                  {/* Ribbon */}
                  <div className="px-5 py-3 flex items-center justify-between"
                    style={{ background: reached ? `linear-gradient(135deg,${prize.themeColor},${prize.themeColor}CC)` : '#E5E7EB' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{prize.emoji}</span>
                      <div>
                        <p className="text-white font-black text-sm">{prize.tierLabel}</p>
                        <p className="text-white/70 text-xs">{prize.checkinsRequired}개 스탬프 달성</p>
                      </div>
                    </div>
                    {reached && !applied && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-black text-white animate-pulse"
                        style={{ backgroundColor: 'rgba(255,255,255,0.25)' }}>응모 가능!</span>
                    )}
                    {applied && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-black text-white"
                        style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>✅ 응모 완료</span>
                    )}
                    {!reached && (
                      <span className="text-xs text-white/60 font-black">{prize.checkinsRequired - stampCount}개 남음</span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-black text-gray-900 mb-1">{prize.title}</h3>
                    <p className="text-xs text-gray-500 mb-3">{prize.subtitle}</p>

                    {/* Grand prizes */}
                    {prize.grandPrizes && (
                      <div className="space-y-1.5 mb-4">
                        {prize.grandPrizes.map((gp, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                            style={{ backgroundColor: prize.bgColor, border: `1px solid ${prize.borderColor}` }}>
                            <span className="text-lg">{gp.emoji}</span>
                            <span className="text-xs font-black text-gray-700 flex-1">{gp.name}</span>
                            <span className="text-xs font-black" style={{ color: prize.themeColor }}>{gp.quantity}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Applied info */}
                    {applied && entry && (
                      <div className="rounded-xl px-3 py-2.5 mb-3"
                        style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 size={13} color={GREEN} />
                          <p className="text-xs font-black" style={{ color: GREEN }}>응모 완료</p>
                        </div>
                        <div className="space-y-1">
                          {[
                            { label: '응모일', value: new Date(entry.appliedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }) },
                            { label: '응모자', value: entry.userName },
                            { label: '이메일', value: entry.userEmail },
                            { label: '보유 스탬프', value: `${entry.stampCount}개` },
                          ].map((row) => (
                            <div key={row.label} className="flex justify-between text-xs">
                              <span className="text-gray-400">{row.label}</span>
                              <span className="text-gray-700 font-black">{row.value}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">
                          💡 참여 매장에 정보가 전달되었습니다. 추첨 후 개별 연락됩니다.
                        </p>
                      </div>
                    )}

                    {/* CTA */}
                    {reached && !applied ? (
                      <motion.button
                        onClick={() => setApplyingPrize(prize)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className="w-full py-3.5 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
                        style={{ background: `linear-gradient(135deg,${prize.themeColor},${prize.themeColor}CC)` }}>
                        <Ticket size={16} /> 응모하기
                      </motion.button>
                    ) : reached && applied ? (
                      <div className="w-full py-3 rounded-2xl text-center text-sm font-black border-2"
                        style={{ borderColor: '#86EFAC', color: GREEN }}>
                        ✅ 이미 응모한 리워드에요
                      </div>
                    ) : (
                      <div className="w-full py-3 rounded-2xl text-center text-sm font-black"
                        style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
                        스탬프 {prize.checkinsRequired - stampCount}개 더 모으면 응모 가능
                      </div>
                    )}

                    <p className="text-xs text-gray-300 text-center mt-2">{prize.limitPeriod}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ═══ Tab: History (룰렛 이력) ═══ */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-gray-700">🎰 룰렛 참여 이력</p>
              <button onClick={loadHistory} disabled={isLoadingHistory}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
                <RefreshCw size={11} className={isLoadingHistory ? 'animate-spin' : ''} /> 새로고침
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="flex items-center justify-center py-10">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-8 h-8 rounded-full"
                  style={{ border: `3px solid ${GREEN}`, borderTopColor: 'transparent' }} />
              </div>
            ) : spinHistory.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border-2" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-5xl mb-3">🎲</p>
                <p className="font-black text-gray-700 mb-1">참여 기록이 없어요</p>
                <p className="text-xs text-gray-400 mb-5">QR 코드를 스캔해서 룰렛에 참여해보세요!</p>
                <Link to="/map"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black"
                  style={{ backgroundColor: GREEN }}>
                  <MapPin size={14} /> 매장 찾기
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {spinHistory.map((item, i) => {
                  const color = item.prizeColor || '#6B7280';
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 p-3.5 rounded-2xl border-2 bg-white"
                      style={{ borderColor: color + '25' }}>
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                        style={{ backgroundColor: color + '15' }}>
                        {item.prizeEmoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm text-gray-900 truncate">{item.prizeName}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          <Store size={9} className="inline mr-1" />{item.storeName || item.storeId}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-black block mb-1"
                          style={{ backgroundColor: color + '15', color }}>
                          증정권 발급
                        </span>
                        <p className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
                <p className="text-center text-xs text-gray-400">총 {spinHistory.length}회 참여</p>
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <Link to="/stamps"
            className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#F3F4F6' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F8EF' }}>
              <Stamp size={18} color={GREEN} />
            </div>
            <div>
              <p className="font-black text-sm text-gray-900">스탬프 보기</p>
              <p className="text-xs text-gray-400">{stampCount} / 10개</p>
            </div>
          </Link>
          <Link to="/map"
            className="flex items-center gap-3 p-4 rounded-2xl border-2 bg-white hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#F3F4F6' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
              <MapPin size={18} color="#0057B8" />
            </div>
            <div>
              <p className="font-black text-sm text-gray-900">매장 찾기</p>
              <p className="text-xs text-gray-400">룰렛 참여하기</p>
            </div>
          </Link>
        </div>

        <div className="text-center py-5">
          <p className="text-xs text-gray-400">칠성사이다 × 김밥대장 스탬프 투어 2026</p>
          <p className="text-xs text-gray-300 mt-0.5">데모 환경 · 실제 경품 미지급</p>
        </div>
      </div>

      {/* Lottery Apply Modal */}
      <AnimatePresence>
        {applyingPrize && (
          <LotteryApplyModal
            prize={applyingPrize}
            userName={displayName}
            userEmail={displayEmail}
            stampCount={stampCount}
            onClose={() => setApplyingPrize(null)}
            onApply={() => handleLotteryApply(applyingPrize.id)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
