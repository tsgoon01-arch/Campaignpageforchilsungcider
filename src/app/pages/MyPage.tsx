import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, MapPin, Stamp, Gift, ChevronRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useAuth } from '../context/AuthContext';
import { useStamp } from '../context/StampContext';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const GREEN = '#2BAE4E';
const YELLOW = '#FFD740';
const DEVICE_ID_KEY = 'chilsung-device-id';

function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

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

// ── Coupon Card ───────────────────────────────────────────────────────────────
function CouponCard({ coupon, onUse, isUsing, accessToken, onCouponUpdate }: {
  coupon: Coupon;
  onUse: (couponId: string) => void;
  isUsing: boolean;
  accessToken: string | null;
  onCouponUpdate: (updated: Coupon) => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [shippingDone, setShippingDone] = useState(false);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [shippingInfo, setShippingInfo] = useState({ name: '', phone: '', address: '', size: 'M' });

  const color = coupon.prizeColor || (coupon.prizeId === 'tshirt' ? '#EF4444' : '#0057B8');
  const expiryDate = new Date(new Date(coupon.issuedAt).getTime() + 30 * 24 * 60 * 60 * 1000);
  const isExpired = new Date() > expiryDate;
  const isTshirt = coupon.prizeId === 'tshirt';

  const handleShippingSubmit = async () => {
    if (!shippingInfo.name || !shippingInfo.phone || !shippingInfo.address) {
      setShippingError('모든 항목을 입력해주세요.');
      return;
    }
    if (!accessToken) return;
    setShippingLoading(true);
    setShippingError('');
    try {
      const res = await fetch(`${SERVER_URL}/roulette/coupon/shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ couponId: coupon.couponId, ...shippingInfo }),
      });
      const d = await res.json();
      if (!res.ok || d.error) {
        setShippingError(d.error || '배송 신청 중 오류가 발생했습니다.');
      } else {
        setShippingDone(true);
        setShowShipping(false);
        if (d.coupon) onCouponUpdate(d.coupon);
      }
    } catch (err) {
      setShippingError(`네트워크 오류: ${err}`);
    } finally {
      setShippingLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: coupon.isUsed ? 0.65 : 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl border-2"
      style={{
        borderColor: coupon.isUsed ? '#E5E7EB' : color + '60',
        backgroundColor: coupon.isUsed ? '#F9FAFB' : color + '08',
      }}
    >
      {/* Used watermark (non-tshirt) */}
      {coupon.isUsed && !isTshirt && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="rotate-[-20deg] border-4 rounded-xl px-6 py-2"
            style={{ borderColor: '#9CA3AF', color: '#9CA3AF', fontSize: '28px', fontWeight: 900, opacity: 0.35 }}>
            사용완료
          </div>
        </div>
      )}

      {/* Coupon hole dots (decorative) */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-6 h-6 rounded-full bg-white border-2"
        style={{ borderColor: coupon.isUsed ? '#E5E7EB' : color + '40' }} />
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-6 h-6 rounded-full bg-white border-2"
        style={{ borderColor: coupon.isUsed ? '#E5E7EB' : color + '40' }} />

      <div className="px-5 py-4">
        {/* Top section */}
        <div className="flex items-start gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0"
            style={{ backgroundColor: color + '20' }}>
            {coupon.prizeEmoji}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-black"
                style={{ backgroundColor: color + '20', color }}>
                {isTshirt ? '🔥 한정판' : '🥤 교환권'}
              </span>
              {coupon.isUsed && (
                <span className="text-xs px-2 py-0.5 rounded-full font-black"
                  style={{ backgroundColor: isTshirt ? '#F0FDF4' : '#F3F4F6', color: isTshirt ? GREEN : '#9CA3AF' }}>
                  {isTshirt ? '✈️ 배송신청 완료' : '사용완료'}
                </span>
              )}
            </div>
            <h3 className="font-black text-gray-900" style={{ fontSize: '15px' }}>{coupon.prizeName}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {coupon.storeName}</p>
          </div>
        </div>

        {/* Shipping done badge */}
        {shippingDone && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-xl px-3 py-2 mb-3 flex items-center gap-2"
            style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC' }}>
            <span className="text-lg">✈️</span>
            <div>
              <p className="font-black text-xs" style={{ color: GREEN }}>배송 신청 완료!</p>
              <p className="text-xs text-gray-500">3~5일 내 발송 예정 (데모: 실제 미발송)</p>
            </div>
          </motion.div>
        )}

        {/* Tshirt: shipping form */}
        <AnimatePresence>
          {isTshirt && showShipping && !coupon.isUsed && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
              <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5' }}>
                <p className="font-black text-sm mb-3" style={{ color: '#EF4444' }}>📦 티셔츠 배송 신청</p>

                {shippingError && (
                  <p className="text-xs text-red-500 mb-2 font-black">⚠️ {shippingError}</p>
                )}

                <div className="space-y-2.5">
                  {/* 이름 */}
                  <div>
                    <label className="block text-xs font-black text-gray-600 mb-1">수령인 이름 *</label>
                    <input type="text" placeholder="홍길동"
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#FCA5A5', backgroundColor: 'white' }}
                      onFocus={(e) => e.target.style.borderColor = '#EF4444'}
                      onBlur={(e) => e.target.style.borderColor = '#FCA5A5'}
                      value={shippingInfo.name}
                      onChange={(e) => setShippingInfo((p) => ({ ...p, name: e.target.value }))} />
                  </div>
                  {/* 전화번호 */}
                  <div>
                    <label className="block text-xs font-black text-gray-600 mb-1">연락처 *</label>
                    <input type="tel" placeholder="010-0000-0000"
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#FCA5A5', backgroundColor: 'white' }}
                      onFocus={(e) => e.target.style.borderColor = '#EF4444'}
                      onBlur={(e) => e.target.style.borderColor = '#FCA5A5'}
                      value={shippingInfo.phone}
                      onChange={(e) => setShippingInfo((p) => ({ ...p, phone: e.target.value }))} />
                  </div>
                  {/* 주소 */}
                  <div>
                    <label className="block text-xs font-black text-gray-600 mb-1">배송 주소 *</label>
                    <input type="text" placeholder="서울시 강남구 테헤란로 123, 101호"
                      className="w-full px-3 py-2 rounded-xl border text-sm outline-none"
                      style={{ borderColor: '#FCA5A5', backgroundColor: 'white' }}
                      onFocus={(e) => e.target.style.borderColor = '#EF4444'}
                      onBlur={(e) => e.target.style.borderColor = '#FCA5A5'}
                      value={shippingInfo.address}
                      onChange={(e) => setShippingInfo((p) => ({ ...p, address: e.target.value }))} />
                  </div>
                  {/* 사이즈 */}
                  <div>
                    <label className="block text-xs font-black text-gray-600 mb-1.5">사이즈 *</label>
                    <div className="flex gap-2">
                      {['S', 'M', 'L', 'XL'].map((s) => (
                        <button key={s} onClick={() => setShippingInfo((p) => ({ ...p, size: s }))}
                          className="flex-1 py-2 rounded-xl text-sm font-black border-2 transition-all"
                          style={{
                            borderColor: shippingInfo.size === s ? '#EF4444' : '#FCA5A5',
                            backgroundColor: shippingInfo.size === s ? '#FEF2F2' : 'white',
                            color: shippingInfo.size === s ? '#EF4444' : '#6B7280',
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setShowShipping(false); setShippingError(''); }}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black bg-white border-2"
                    style={{ borderColor: '#FCA5A5', color: '#9CA3AF' }}>
                    취소
                  </button>
                  <button onClick={handleShippingSubmit} disabled={shippingLoading}
                    className="flex-1 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1"
                    style={{ backgroundColor: '#EF4444' }}>
                    {shippingLoading
                      ? <><RefreshCw size={11} className="animate-spin" /> 신청 중...</>
                      : '✈️ 배송 신청하기'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Divider */}
        <div className="border-t border-dashed my-3" style={{ borderColor: coupon.isUsed ? '#E5E7EB' : color + '30' }} />

        {/* Bottom section */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">
              발급: {new Date(coupon.issuedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
            </p>
            {coupon.isUsed && coupon.usedAt ? (
              <p className="text-xs font-black" style={{ color: isTshirt ? GREEN : '#9CA3AF' }}>
                {isTshirt ? '✈️ 배송 신청됨' : `사용: ${new Date(coupon.usedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}`}
              </p>
            ) : (
              <p className="text-xs" style={{ color: isExpired ? '#EF4444' : '#9CA3AF' }}>
                {isExpired ? '⚠️ 만료됨' : `~ ${expiryDate.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 까지`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!coupon.isUsed && !isExpired && (
              <>
                {/* Tshirt: shipping button */}
                {isTshirt && !showShipping && (
                  <button onClick={() => setShowShipping(true)}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#EF4444' }}>
                    📦 배송 신청
                  </button>
                )}

                {/* Non-tshirt or fallback: use button */}
                {!isTshirt && (
                  <>
                    {showConfirm ? (
                      <div className="flex gap-2">
                        <button onClick={() => setShowConfirm(false)}
                          className="px-3 py-1.5 rounded-xl text-xs font-black bg-gray-100 text-gray-600 hover:bg-gray-200">
                          취소
                        </button>
                        <button
                          onClick={() => { onUse(coupon.couponId); setShowConfirm(false); }}
                          disabled={isUsing}
                          className="px-3 py-1.5 rounded-xl text-xs font-black text-white flex items-center gap-1"
                          style={{ backgroundColor: color }}>
                          {isUsing ? <RefreshCw size={11} className="animate-spin" /> : <CheckCircle2 size={11} />}
                          사용 확인
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setShowConfirm(true)}
                        className="px-4 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: color }}>
                        🎫 사용하기
                      </button>
                    )}
                  </>
                )}
              </>
            )}
            {coupon.isUsed && (
              <div className="flex items-center gap-1 text-xs font-black"
                style={{ color: isTshirt ? GREEN : '#9CA3AF' }}>
                <CheckCircle2 size={13} />
                {isTshirt ? '배송신청 완료' : '사용완료'}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function MyPage() {
  const { user, signOut, accessToken } = useAuth();
  const { stampCount, entries } = useStamp();
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [spinHistory, setSpinHistory] = useState<SpinHistory[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [usingCouponId, setUsingCouponId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'coupons' | 'history' | 'entries'>('coupons');
  const [newCouponAlert, setNewCouponAlert] = useState(false);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '게스트';
  const initials = displayName.slice(0, 1).toUpperCase();
  const isGuest = !user;
  const deviceId = getDeviceId();

  const unusedCount = coupons.filter((c) => !c.isUsed).length;

  // ── Load coupons ────────────────────────────────────────────────────────────
  const loadCoupons = useCallback(async () => {
    if (!accessToken) return;
    setIsLoadingCoupons(true);
    try {
      const res = await fetch(`${SERVER_URL}/roulette/coupons`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const d = await res.json();
      setCoupons(d.coupons || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setIsLoadingCoupons(false);
    }
  }, [accessToken]);

  // ── Load roulette history ────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const params = new URLSearchParams({ deviceId });
      const res = await fetch(`${SERVER_URL}/roulette/history?${params}`, {
        headers: { Authorization: `Bearer ${accessToken || publicAnonKey}` },
      });
      const d = await res.json();
      setSpinHistory(d.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [accessToken, deviceId]);

  useEffect(() => {
    loadCoupons();
    loadHistory();
  }, [loadCoupons, loadHistory]);

  // Check if there are newly claimed coupons (from pending)
  useEffect(() => {
    if (coupons.length > 0) {
      const hasRecent = coupons.some((c) => {
        const issued = new Date(c.issuedAt);
        return (Date.now() - issued.getTime()) < 60 * 1000; // issued within last 60s
      });
      if (hasRecent) setNewCouponAlert(true);
    }
  }, [coupons]);

  // ── Use coupon ─────────────────────────────────────────────────────────────
  const handleUseCoupon = async (couponId: string) => {
    if (!accessToken) return;
    setUsingCouponId(couponId);
    try {
      const res = await fetch(`${SERVER_URL}/roulette/coupon/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ couponId }),
      });
      const d = await res.json();
      if (d.coupon) {
        setCoupons((prev) => prev.map((c) => c.couponId === couponId ? d.coupon : c));
      }
    } catch (err) {
      console.error('Failed to use coupon:', err);
    } finally {
      setUsingCouponId(null);
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const nextMilestoneCount = [2, 4, 5, 7, 10].find((n) => n > stampCount) ?? 10;
  const remainingToNext = Math.max(0, nextMilestoneCount - stampCount);

  return (
    <div style={{ backgroundColor: '#F8FAFF', minHeight: '100vh' }}>
      {/* Header */}
      <div className="text-white py-8 px-4" style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <p className="text-green-100 text-sm font-black">마이페이지</p>
            {user && (
              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
                style={{ backgroundColor: 'rgba(0,0,0,0.2)', color: 'white' }}>
                <LogOut size={12} /> 로그아웃
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black shadow-lg text-2xl"
              style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.3)' }}>
              {isGuest ? '👤' : initials}
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{displayName}</h1>
              <p className="text-green-200 text-sm mt-0.5">
                {isGuest ? '로그인하면 더 많은 혜택을!' : user?.email}
              </p>
              {user?.user_metadata?.provider && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-black"
                  style={{ backgroundColor: 'rgba(255,215,64,0.25)', color: YELLOW }}>
                  {user.user_metadata.provider === 'naver' ? '네이버' : '카카오'} 로그인
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-2 mt-5">
            {[
              { label: '스탬프', value: stampCount, suffix: '/10', color: 'white' },
              { label: '교환권', value: unusedCount, suffix: '개', color: unusedCount > 0 ? YELLOW : 'white' },
              { label: '룰렛', value: spinHistory.length, suffix: '회', color: 'white' },
              { label: '응모권', value: (entries.tshirt77 ? 1 : 0) + (entries.korail ? 1 : 0), suffix: '개', color: 'white' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl p-2.5 text-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}>
                <p className="text-xl font-black" style={{ color: stat.color }}>
                  {stat.value}<span className="text-xs ml-0.5 opacity-70">{stat.suffix}</span>
                </p>
                <p className="text-green-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New coupon alert */}
      <AnimatePresence>
        {newCouponAlert && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
            style={{ backgroundColor: '#FFD740' }}>
            <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center justify-between">
              <p className="text-sm font-black" style={{ color: '#1a1a1a' }}>🎫 새 교환권이 발급되었어요!</p>
              <button onClick={() => setNewCouponAlert(false)} className="text-xs font-black opacity-50 hover:opacity-100">✕</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Guest login prompt */}
        {isGuest && (
          <div className="bg-white rounded-3xl shadow-sm border-2 p-5 mb-4" style={{ borderColor: '#F3F4F6' }}>
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">🔐</span>
              <div className="flex-1">
                <p className="font-black text-sm text-gray-900 mb-1">로그인하고 교환권을 받으세요!</p>
                <p className="text-xs text-gray-500 mb-3">룰렛 교환권 · 스탬프 영구 보관 · 응모권 관리</p>
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1 py-2.5 text-center rounded-xl text-white text-sm font-black hover:opacity-90"
                    style={{ backgroundColor: GREEN }}>로그인</Link>
                  <Link to="/signup" className="flex-1 py-2.5 text-center rounded-xl text-sm font-black border-2 border-gray-200 text-gray-700 hover:bg-gray-50">회원가입</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Nav */}
        <div className="flex gap-1.5 mb-4 p-1.5 bg-white rounded-2xl shadow-sm border" style={{ borderColor: '#F3F4F6' }}>
          {([
            { key: 'coupons', label: '내 교환권', icon: '🎫', badge: unusedCount > 0 ? unusedCount : null },
            { key: 'history', label: '룰렛 이력', icon: '🎰', badge: null },
            { key: 'entries', label: '응모권', icon: '🎟️', badge: null },
          ] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-black transition-all relative"
              style={activeTab === tab.key
                ? { backgroundColor: GREEN, color: 'white' }
                : { color: '#6B7280' }}>
              {tab.icon} {tab.label}
              {tab.badge !== null && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: '#EF4444' }}>{tab.badge}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab: Coupons ─────────────────────────────────────────────────── */}
        {activeTab === 'coupons' && (
          <div>
            {!user ? (
              <div className="bg-white rounded-3xl p-8 text-center border-2" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-4xl mb-3">🔐</p>
                <p className="font-black text-gray-700 mb-1">로그인이 필요해요</p>
                <p className="text-xs text-gray-400 mb-4">교환권은 로그인 후 발급됩니다</p>
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
                <p className="font-black text-gray-700 mb-1">아직 교환권이 없어요</p>
                <p className="text-xs text-gray-400 mb-5">매장 QR을 스캔하고 룰렛에 참여해보세요!</p>
                <Link to="/map"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-black hover:opacity-90"
                  style={{ backgroundColor: GREEN }}>
                  <MapPin size={14} /> 매장 찾기
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Usage guide */}
                <div className="rounded-2xl px-4 py-3 flex items-start gap-2.5"
                  style={{ backgroundColor: '#FFF9E6', border: '1.5px solid #FCD34D' }}>
                  <span className="text-lg shrink-0">💡</span>
                  <div>
                    <p className="font-black text-xs mb-0.5" style={{ color: '#92400E' }}>교환권 사용 방법</p>
                    <p className="text-xs" style={{ color: '#B45309' }}>
                      🥤 사이다 1+1: 편의점 계산대에서 앱 화면 제시<br />
                      👕 한정판 티셔츠: 캠페인 사이트에서 배송 신청
                    </p>
                  </div>
                </div>

                {/* Coupon list */}
                {coupons.map((coupon) => (
                  <CouponCard
                    key={coupon.couponId}
                    coupon={coupon}
                    onUse={handleUseCoupon}
                    isUsing={usingCouponId === coupon.couponId}
                    accessToken={accessToken}
                    onCouponUpdate={(updated: Coupon) =>
                      setCoupons((prev) => prev.map((c) => c.couponId === updated.couponId ? updated : c))
                    }
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

        {/* ── Tab: History ─────────────────────────────────────────────────── */}
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
                        <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {item.storeName || item.storeId}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs px-2 py-0.5 rounded-full font-black block mb-1"
                          style={{ backgroundColor: color + '15', color }}>당첨!</span>
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

        {/* ── Tab: Entries ─────────────────────────────────────────────────── */}
        {activeTab === 'entries' && (
          <div className="space-y-3">
            {/* Info banner */}
            <div className="rounded-2xl p-4" style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
              <p className="font-black text-sm mb-1.5" style={{ color: '#92400E' }}>🎟️ 스탬프 특별 응모권</p>
              <p className="text-xs" style={{ color: '#B45309' }}>
                <span className="font-black">4번째 스탬프</span> → 👕 한정판 티셔츠 77명 추첨<br />
                <span className="font-black">7번째 스탬프</span> → 🚂 코레일 기차 여행권 추첨
              </p>
            </div>

            {!user ? (
              <div className="bg-white rounded-3xl p-8 text-center border-2" style={{ borderColor: '#F3F4F6' }}>
                <p className="text-4xl mb-3">🔐</p>
                <p className="font-black text-gray-700 mb-1">로그인이 필요해요</p>
                <p className="text-xs text-gray-400 mb-4">응모권은 로그인 후 자동 등록됩니다</p>
                <Link to="/login"
                  className="inline-flex px-5 py-2.5 rounded-xl text-white text-sm font-black"
                  style={{ backgroundColor: GREEN }}>로그인하기</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {/* T-shirt 77 */}
                <div className={`flex items-center gap-4 p-5 rounded-3xl border-2 ${entries.tshirt77 ? '' : 'opacity-50'}`}
                  style={{
                    backgroundColor: entries.tshirt77 ? '#FEF2F2' : '#F9FAFB',
                    borderColor: entries.tshirt77 ? '#FECACA' : '#E5E7EB',
                  }}>
                  <span className="text-4xl shrink-0">👕</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black" style={{ color: entries.tshirt77 ? '#EF4444' : '#9CA3AF', fontSize: '15px' }}>
                      한정판 티셔츠 77명 추첨
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">칠성사이다 × 김밥대장 콜라보</p>
                    {entries.tshirt77 ? (
                      <p className="text-xs font-black mt-1" style={{ color: '#EF4444' }}>
                        ✓ 등록: {new Date(entries.tshirt77.registeredAt).toLocaleDateString('ko-KR')}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        스탬프 4번 달성 시 자동 등록 ({Math.max(0, 4 - stampCount)}개 남음)
                      </p>
                    )}
                  </div>
                  {entries.tshirt77 ? (
                    <span className="text-xs px-3 py-1.5 rounded-xl text-white font-black shrink-0"
                      style={{ backgroundColor: '#EF4444' }}>등록됨 ✓</span>
                  ) : (
                    <div className="shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-sm font-black">
                      {Math.max(0, 4 - stampCount)}
                    </div>
                  )}
                </div>

                {/* Korail */}
                <div className={`flex items-center gap-4 p-5 rounded-3xl border-2 ${entries.korail ? '' : 'opacity-50'}`}
                  style={{
                    backgroundColor: entries.korail ? '#FFFBEB' : '#F9FAFB',
                    borderColor: entries.korail ? '#FCD34D' : '#E5E7EB',
                  }}>
                  <span className="text-4xl shrink-0">🚂</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black" style={{ color: entries.korail ? '#E8A000' : '#9CA3AF', fontSize: '15px' }}>
                      코레일 기차 여행권 추첨
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">KTX 포함 전국 기차 여행권</p>
                    {entries.korail ? (
                      <p className="text-xs font-black mt-1" style={{ color: '#E8A000' }}>
                        ✓ 등록: {new Date(entries.korail.registeredAt).toLocaleDateString('ko-KR')}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        스탬프 7번 달성 시 자동 등록 ({Math.max(0, 7 - stampCount)}개 남음)
                      </p>
                    )}
                  </div>
                  {entries.korail ? (
                    <span className="text-xs px-3 py-1.5 rounded-xl text-white font-black shrink-0"
                      style={{ backgroundColor: '#E8A000' }}>등록됨 ✓</span>
                  ) : (
                    <div className="shrink-0 w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 text-sm font-black">
                      {Math.max(0, 7 - stampCount)}
                    </div>
                  )}
                </div>

                <Link to="/stamps"
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-white text-sm font-black"
                  style={{ backgroundColor: GREEN }}>
                  <Stamp size={14} /> 스탬프 더 모으기 <ChevronRight size={13} />
                </Link>
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
    </div>
  );
}