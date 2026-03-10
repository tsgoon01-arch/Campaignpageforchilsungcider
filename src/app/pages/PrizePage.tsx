import { Link } from 'react-router';
import { CheckCircle2, Gift, AlertCircle, ChevronRight, Trophy, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { prizes, Prize } from '../data/prizes';
import { useStamp } from '../context/StampContext';
import { useState } from 'react';

const GREEN = '#2BAE4E';
const BHS = "'Black Han Sans', sans-serif";

const faqItems = [
  {
    q: '4스탬프 티셔츠 추첨은 어떻게 진행되나요?',
    a: '4번째 스탬프 달성 시 자동으로 추첨 응모가 완료됩니다. 캠페인 종료 후 77명을 추첨하여 개별 연락드립니다.',
  },
  {
    q: '7스탬프 코레일 여행권 추첨은 어떻게 진행되나요?',
    a: '7번째 스탬프 달성 시 자동으로 추첨 응모가 완료됩니다. KTX 왕복 10명, 일반 기차 20명을 캠페인 종료 후 추첨합니다.',
  },
  {
    q: '추첨 결과는 언제 발표되나요?',
    a: '2026년 6월 30일 추첨 후 등록하신 연락처로 개별 안내됩니다. 제세공과금은 칠성사이다 측에서 대납합니다.',
  },
  {
    q: '같은 가게를 여러 번 방문해도 체크인이 쌓이나요?',
    a: '가게당 1회만 체크인이 인정됩니다. 10개 가게를 각각 1회씩 방문해야 최대 10개 체크인이 가능합니다.',
  },
  {
    q: 'GPS 위치 인증이 안 될 때는 어떻게 하나요?',
    a: '위치 권한을 허용했는지 확인해 주세요. 건물 내부나 지하에서는 GPS 정확도가 낮을 수 있으니 실외에서 다시 시도해 주세요.',
  },
];

// ── Prize Tier Card ───────────────────────────────────────────────────────────
function TierCard({ prize, checkinCount, onApply }: { prize: Prize; checkinCount: number; onApply: (prize: Prize) => void }) {
  const unlocked = checkinCount >= prize.checkinsRequired;
  const remaining = prize.checkinsRequired - checkinCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-3xl overflow-hidden"
      style={{
        border: `2.5px solid ${unlocked ? prize.themeColor : '#E5E7EB'}`,
        boxShadow: unlocked ? `4px 4px 0 ${prize.themeColor}` : '4px 4px 0 #E5E7EB',
      }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <img src={prize.image} alt={prize.title}
          className="w-full h-full object-cover"
          style={{ filter: unlocked ? 'none' : 'grayscale(60%) brightness(0.85)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.75))' }} />

        {/* Lock overlay */}
        {!unlocked && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-2xl px-5 py-3 text-center">
              <Lock size={24} className="mx-auto mb-1 text-white/80" />
              <p className="text-white text-sm font-black">체크인 {remaining}회 더 필요</p>
            </div>
          </div>
        )}

        {/* Label badge */}
        <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full font-black text-xs text-white"
          style={{ background: unlocked ? prize.themeColor : '#6B7280', fontFamily: BHS, letterSpacing: '1px' }}>
          {prize.tierLabel} · {prize.checkinsRequired}회 체크인
        </div>

        {/* Unlocked check */}
        {unlocked && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400 }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: prize.themeColor, border: '2px solid white' }}>
            <CheckCircle2 size={16} color="white" />
          </motion.div>
        )}

        {/* Badge pill */}
        <div className="absolute bottom-14 left-4">
          <span className="text-xs px-2.5 py-1 rounded-full font-black text-white"
            style={{ backgroundColor: prize.themeColor + 'CC' }}>
            {prize.badge}
          </span>
        </div>

        {/* Bottom title */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="text-white/70 text-xs mb-0.5">{prize.subtitle}</p>
          <h3 className="text-white font-black" style={{ fontFamily: BHS, fontSize: 'clamp(16px,2.5vw,20px)', lineHeight: 1.2 }}>
            {prize.emoji} {prize.title}
          </h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{prize.description}</p>

        {/* Grand prizes */}
        {prize.grandPrizes && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: prize.bgColor, border: `1.5px solid ${prize.borderColor}` }}>
            <p className="text-xs font-black mb-3" style={{ color: prize.themeColor }}>🏆 추첨 경품 상세</p>
            <div className="space-y-2">
              {prize.grandPrizes.map((gp, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, x: -8 }} whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }} viewport={{ once: true }}
                  className="flex items-center justify-between p-3 rounded-xl bg-white"
                  style={{ border: `1px solid ${prize.borderColor}` }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{gp.emoji}</span>
                    <span className="font-black text-sm text-gray-900">{gp.name}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-black text-white"
                    style={{ backgroundColor: prize.themeColor }}>{gp.quantity}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2.5">※ 제세공과금 칠성사이다 측 대납 예정</p>
          </div>
        )}

        {/* Delivery badge */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{ backgroundColor: prize.bgColor, color: prize.themeColor }}>
            <Trophy size={12} /> {prize.deliveryMethod}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black"
            style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            {prize.limitPeriod}
          </div>
        </div>

        {/* Progress bar (locked) */}
        {!unlocked && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>진행률</span>
              <span>{checkinCount}/{prize.checkinsRequired}회</span>
            </div>
            <div className="w-full rounded-full h-2.5" style={{ backgroundColor: '#F3F4F6' }}>
              <motion.div className="h-2.5 rounded-full"
                style={{ background: `linear-gradient(90deg,${prize.themeColor},${prize.themeColor}99)` }}
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min((checkinCount / prize.checkinsRequired) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                viewport={{ once: true }} />
            </div>
          </div>
        )}

        {/* CTA */}
        {unlocked ? (
          <button onClick={() => onApply(prize)}
            className="w-full py-3.5 rounded-2xl text-white font-black text-sm hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg,${prize.themeColor},${prize.themeColor}CC)`, fontFamily: BHS }}>
            <Trophy size={16} /> 추첨 참가하기 <ChevronRight size={15} />
          </button>
        ) : (
          <Link to="/map"
            className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ backgroundColor: '#F3F4F6', color: '#6B7280', fontFamily: BHS }}>
            <ChevronRight size={15} /> 체크인 {remaining}회 더 모으기
          </Link>
        )}
      </div>
    </motion.div>
  );
}

// ── Apply Modal ───────────────────────────────────────────────────────────────
function ApplyModal({ prize, checkinCount, onClose }: { prize: Prize; checkinCount: number; onClose: () => void }) {
  const [phase, setPhase] = useState<'confirm' | 'processing' | 'done'>('confirm');

  const handleConfirm = () => {
    setPhase('processing');
    setTimeout(() => setPhase('done'), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="relative bg-white w-full sm:max-w-sm rounded-3xl shadow-2xl overflow-hidden"
        style={{ border: `2.5px solid ${prize.themeColor}` }}>

        <div className="h-2" style={{ background: `linear-gradient(90deg,${prize.themeColor},${prize.themeColor}88)` }} />

        <div className="p-7 text-center">
          <AnimatePresence mode="wait">
            {phase === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl"
                  style={{ backgroundColor: prize.bgColor, border: `2px solid ${prize.borderColor}` }}>
                  {prize.emoji}
                </div>
                <p className="text-xs font-black mb-1" style={{ color: prize.themeColor }}>{prize.tierLabel}</p>
                <h3 className="text-gray-900 mb-1 font-black text-lg">{prize.title}</h3>
                <p className="text-gray-400 text-sm mb-1">{prize.subtitle}</p>
                <div className="inline-flex items-center gap-1 mt-1 mb-5 px-3 py-1 rounded-full text-xs font-black"
                  style={{ backgroundColor: prize.bgColor, color: prize.themeColor }}>
                  체크인 {checkinCount}회 달성 ✓
                </div>

                {prize.grandPrizes && (
                  <div className="rounded-xl p-3 mb-5 text-left space-y-2" style={{ backgroundColor: prize.bgColor }}>
                    {prize.grandPrizes.map((gp) => (
                      <div key={gp.name} className="flex items-center gap-2 text-sm">
                        <span>{gp.emoji}</span>
                        <span className="font-black text-gray-800">{gp.name}</span>
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full text-white font-black"
                          style={{ backgroundColor: prize.themeColor }}>{gp.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-xl p-3 mb-5 text-left text-xs text-blue-700" style={{ backgroundColor: '#EFF6FF' }}>
                  ※ 데모 페이지입니다. 실제 추첨 참가는 캠페인 정식 오픈 후 가능합니다.
                </div>

                <div className="flex gap-2.5">
                  <button onClick={onClose}
                    className="flex-1 py-3 rounded-2xl text-gray-700 font-black text-sm"
                    style={{ backgroundColor: '#F3F4F6' }}>취소</button>
                  <button onClick={handleConfirm}
                    className="flex-1 py-3 rounded-2xl text-white font-black text-sm hover:opacity-90"
                    style={{ background: `linear-gradient(135deg,${prize.themeColor},${prize.themeColor}CC)` }}>
                    추첨 참가
                  </button>
                </div>
              </motion.div>
            )}

            {phase === 'processing' && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-6">
                <motion.div className="w-14 h-14 rounded-full border-4 border-t-transparent mx-auto mb-4"
                  style={{ borderColor: `${prize.themeColor}33`, borderTopColor: prize.themeColor }}
                  animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} />
                <p className="font-black text-gray-700">추첨 등록 중...</p>
              </motion.div>
            )}

            {phase === 'done' && (
              <motion.div key="done" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-2">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: `linear-gradient(135deg,${prize.bgColor},white)`, border: `3px solid ${prize.themeColor}` }}>
                  <Trophy size={36} style={{ color: prize.themeColor }} />
                </motion.div>
                <h3 className="text-xl font-black text-gray-900 mb-2">추첨 참가 완료! 🎉</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                  축하해요! 추첨 결과는 2026년 6월 30일 이후<br />등록하신 연락처로 개별 안내됩니다.
                </p>
                <button onClick={onClose}
                  className="w-full py-3.5 rounded-2xl text-white font-black hover:opacity-90"
                  style={{ background: `linear-gradient(135deg,${prize.themeColor},${prize.themeColor}CC)` }}>
                  확인
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function PrizePage() {
  const { stampCount } = useStamp();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [applyPrize, setApplyPrize] = useState<Prize | null>(null);

  const unlockedPrizes = prizes.filter((p) => stampCount >= p.checkinsRequired);

  return (
    <div style={{ backgroundColor: '#F8FAFF', minHeight: '100vh' }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="relative py-12 px-4 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1A0533 0%, #2D0A5C 50%, #0D0D0D 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        {['👕', '🚂', '🥤', '🏆', '🎁', '⭐'].map((e, i) => (
          <motion.div key={i} className="absolute text-xl pointer-events-none opacity-20"
            style={{ top: `${[15, 65, 25, 75, 40, 55][i]}%`, left: `${[5, 8, 82, 88, 50, 25][i]}%` }}
            animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5 + i * 0.4, repeat: Infinity }}>{e}</motion.div>
        ))}

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-4 text-white/80">
            <Gift size={14} /> 2026 김밥대장 로드 리워드
          </div>
          <h1 className="font-black mb-3 text-white"
            style={{ fontFamily: BHS, fontSize: 'clamp(28px,5vw,48px)', lineHeight: 1.1 }}>
            🎁 내 리워드
          </h1>
          <p className="mb-7" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '15px' }}>
            스탬프 4개·7개 달성 시 추첨 응모가 자동 등록돼요
          </p>

          {/* Status card */}
          <div className="inline-flex flex-wrap items-stretch gap-0 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/15">
            <div className="px-6 py-4 text-left">
              <p className="text-white/50 text-xs mb-0.5">내 체크인</p>
              <p className="font-black text-3xl" style={{ color: '#FFD740', fontFamily: BHS }}>{stampCount}</p>
              <p className="text-white/40 text-xs">/ 10회</p>
            </div>
            <div className="w-px bg-white/15" />
            <div className="px-6 py-4 text-left">
              <p className="text-white/50 text-xs mb-0.5">달성 리워드</p>
              <p className="font-black text-lg text-white">{unlockedPrizes.length > 0 ? `${unlockedPrizes.length}개` : '없음'}</p>
              <p className="text-white/40 text-xs">{unlockedPrizes.length > 0 ? unlockedPrizes.map(p => p.emoji).join(' ') : '4회 체크인 필요'}</p>
            </div>
            {stampCount < 7 && (
              <>
                <div className="w-px bg-white/15" />
                <div className="px-6 py-4 text-left">
                  <p className="text-white/50 text-xs mb-0.5">다음 리워드까지</p>
                  <p className="font-black text-lg" style={{ color: stampCount < 4 ? '#EF4444' : '#E8A000' }}>
                    {stampCount < 4 ? 4 - stampCount : 7 - stampCount}회
                  </p>
                  <Link to="/map" className="text-xs underline underline-offset-2"
                    style={{ color: stampCount < 4 ? '#EF4444' : '#E8A000' }}>
                    김밥집 방문하기
                  </Link>
                </div>
              </>
            )}
            {stampCount === 0 && (
              <Link to="/map"
                className="px-6 py-4 flex items-center font-black text-sm text-gray-900 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: '#FFD740' }}>
                체크인 시작하기 →
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Step progress ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b px-4 py-5" style={{ borderColor: '#F3F4F6' }}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center">
            {/* Step: 0 */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-base border-2"
                style={{ backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' }}>
                🍙
              </div>
              <p className="text-xs font-black mt-1 text-gray-400">시작</p>
              <p className="text-xs text-gray-300">0회</p>
            </div>
            {/* Bar 0→4 */}
            <div className="flex-1 h-2 rounded-full overflow-hidden mx-1" style={{ backgroundColor: '#F3F4F6' }}>
              <motion.div className="h-full rounded-full"
                style={{ backgroundColor: '#EF4444' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stampCount / 4) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
            {/* Step: 4 - 티셔츠 */}
            {prizes.slice(0, 1).map((p) => {
              const reached = stampCount >= p.checkinsRequired;
              return (
                <div key={p.id} className="flex flex-col items-center shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
                    style={{
                      backgroundColor: reached ? p.themeColor : '#F3F4F6',
                      borderColor: reached ? p.themeColor : '#E5E7EB',
                      boxShadow: reached ? `0 0 0 3px ${p.themeColor}22` : 'none',
                    }}>
                    {reached ? <CheckCircle2 size={18} color="white" /> : <span style={{ filter: 'grayscale(1) opacity(0.4)' }}>{p.emoji}</span>}
                  </div>
                  <p className="text-xs font-black mt-1" style={{ color: reached ? p.themeColor : '#9CA3AF' }}>티셔츠</p>
                  <p className="text-xs text-gray-300">4회</p>
                </div>
              );
            })}
            {/* Bar 4→7 */}
            <div className="flex-1 h-2 rounded-full overflow-hidden mx-1" style={{ backgroundColor: '#F3F4F6' }}>
              <motion.div className="h-full rounded-full"
                style={{ backgroundColor: '#E8A000' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(Math.max((stampCount - 4) / 3, 0) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
            {/* Step: 7 - 코레일 */}
            {prizes.slice(1, 2).map((p) => {
              const reached = stampCount >= p.checkinsRequired;
              return (
                <div key={p.id} className="flex flex-col items-center shrink-0">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg border-2"
                    style={{
                      backgroundColor: reached ? p.themeColor : '#F3F4F6',
                      borderColor: reached ? p.themeColor : '#E5E7EB',
                      boxShadow: reached ? `0 0 0 3px ${p.themeColor}22` : 'none',
                    }}>
                    {reached ? <CheckCircle2 size={18} color="white" /> : <span style={{ filter: 'grayscale(1) opacity(0.4)' }}>{p.emoji}</span>}
                  </div>
                  <p className="text-xs font-black mt-1" style={{ color: reached ? p.themeColor : '#9CA3AF' }}>코레일</p>
                  <p className="text-xs text-gray-300">7회</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Prize Cards ────────────────────────────────────────────────────── */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="font-black text-gray-900" style={{ fontFamily: BHS, fontSize: '24px' }}>리워드 구성</h2>
            <p className="text-gray-500 text-sm mt-1">스탬프 달성 시 자동으로 추첨 응모가 완료돼요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {prizes.map((prize) => (
              <TierCard key={prize.id} prize={prize} checkinCount={stampCount} onApply={setApplyPrize} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-10 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-black text-gray-900 text-center mb-8" style={{ fontFamily: BHS, fontSize: '22px' }}>
            리워드 받는 방법
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', icon: '🍙', title: '김밥집 방문', desc: '김밥대장 로드 참여 업장에서 칠성사이다를 주문하세요.' },
              { step: '02', icon: '📍', title: 'GPS 위치 인증', desc: '매장 300m 이내에서 위치 확인 버튼을 누르면 방문이 자동 인증됩니다.' },
              { step: '03', icon: '🎟️', title: '추첨 자동 등록', desc: '4번째·7번째 스탬프 달성 시 추첨 응모가 자동으로 완료됩니다.' },
            ].map((s) => (
              <div key={s.step} className="rounded-2xl p-5 text-center"
                style={{ border: '2px solid #F3F4F6', backgroundColor: '#FAFBFF' }}>
                <div className="text-4xl mb-3">{s.icon}</div>
                <p className="text-xs font-black mb-1" style={{ color: GREEN }}>STEP {s.step}</p>
                <h3 className="font-black text-gray-900 text-sm mb-1">{s.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-black text-gray-900 text-center mb-6" style={{ fontFamily: BHS, fontSize: '22px' }}>FAQ</h2>
          <div className="space-y-2.5">
            {faqItems.map((item, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }} viewport={{ once: true }}
                className="bg-white rounded-2xl border-2 overflow-hidden"
                style={{ borderColor: openFaq === i ? GREEN : '#F3F4F6' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors gap-3">
                  <span className="font-black text-gray-800 text-sm">{item.q}</span>
                  <motion.span animate={{ rotate: openFaq === i ? 45 : 0 }} className="text-xl shrink-0 text-gray-400">+</motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t pt-3" style={{ borderColor: '#F3F4F6' }}>
                        {item.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Notes ──────────────────────────────────────────────────────────── */}
      <section className="py-8 px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-black text-gray-800 flex items-center gap-2 mb-3 text-sm">
              <AlertCircle size={16} className="text-amber-500" /> 유의사항
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-500">
              {[
                '본 캠페인은 국내 거주자를 대상으로 합니다.',
                '추첨 응모는 스탬프 달성 시 자동 등록되며, 1인 1회 원칙입니다.',
                '추첨 당첨 후 7일 이내 미응답 시 당첨이 취소됩니다.',
                '부정한 방법으로 체크인을 획득한 경우 응모가 취소됩니다.',
                '본 캠페인은 사정에 따라 변경 또는 중단될 수 있습니다.',
                '리워드 이미지는 실제와 다를 수 있습니다.',
                '※ 본 페이지는 데모 페이지입니다. 실제 캠페인과 다를 수 있습니다.',
              ].map((note, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                  <span>{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Apply Modal ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {applyPrize && (
          <ApplyModal prize={applyPrize} checkinCount={stampCount} onClose={() => setApplyPrize(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
