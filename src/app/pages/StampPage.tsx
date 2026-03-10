import { Link } from 'react-router';
import { CheckCircle2, MapPin, Gift, RotateCcw, ChevronRight, Ticket, Train, Shirt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStamp } from '../context/StampContext';
import { useAuth } from '../context/AuthContext';
import { stores } from '../data/stores';
import { useState, useEffect } from 'react';

const GREEN = '#2BAE4E';
const GREEN_BG = '#E8F8EF';

// Updated milestone structure with 4-stamp and 7-stamp special entries
const MILESTONES = [
  {
    count: 2,
    label: 'TIER 1',
    emoji: '🥤',
    color: '#0057B8',
    bg: '#EFF6FF',
    borderColor: '#BFDBFE',
    prize: '칠성사이다 1캔 기프티콘 (카카오톡)',
    isSpecialEntry: false,
  },
  {
    count: 4,
    label: '✨ 특별 응모',
    emoji: '👕',
    color: '#EF4444',
    bg: '#FEF2F2',
    borderColor: '#FECACA',
    prize: '한정판 티셔츠 77명 추첨 응모권 자동 등록!',
    isSpecialEntry: true,
    entryKey: 'tshirt77' as const,
    entryTitle: '한정판 티셔츠 77명 추첨',
    badge: '🔥 한정 77명',
  },
  {
    count: 5,
    label: 'TIER 2',
    emoji: '🎁',
    color: '#2BAE4E',
    bg: '#E8F8EF',
    borderColor: '#BBF7D0',
    prize: '칠성사이다 굿즈 세트 (택배)',
    isSpecialEntry: false,
  },
  {
    count: 7,
    label: '✨ 특별 응모',
    emoji: '🚂',
    color: '#E8A000',
    bg: '#FFFBEB',
    borderColor: '#FCD34D',
    prize: '코레일 기차 여행권 추첨 응모권 자동 등록!',
    isSpecialEntry: true,
    entryKey: 'korail' as const,
    entryTitle: '코레일 기차 여행권 추첨',
    badge: '🚄 KTX 포함',
  },
  {
    count: 10,
    label: 'TIER 4',
    emoji: '🏆',
    color: '#7B2D9C',
    bg: '#F3E8FF',
    borderColor: '#C084FC',
    prize: '추첨 고가 경품 (갤럭시북·아이패드·다이슨)',
    isSpecialEntry: false,
  },
];

// Progress bar markers
const PROGRESS_MARKERS = [0, 2, 4, 5, 7, 10];

export function StampPage() {
  const { collectedStamps, isCollected, resetStamps, stampCount, entries, newEntryAlert, clearNewEntryAlert } = useStamp();
  const { user } = useAuth();
  const [showReset, setShowReset] = useState(false);
  const [entryAlert, setEntryAlert] = useState<{ type: string; title: string; emoji: string } | null>(null);

  // Show entry alert when new entry is registered
  useEffect(() => {
    if (newEntryAlert) {
      if (newEntryAlert === 'tshirt77') {
        setEntryAlert({ type: 'tshirt77', title: '한정판 티셔츠 77명 추첨 응모권', emoji: '👕' });
      } else if (newEntryAlert === 'korail') {
        setEntryAlert({ type: 'korail', title: '코레일 기차 여행권 추첨 응모권', emoji: '🚂' });
      }
      clearNewEntryAlert();
    }
  }, [newEntryAlert]);

  const nextMilestone = MILESTONES.find((m) => m.count > stampCount);
  const reachedMilestones = MILESTONES.filter((m) => m.count <= stampCount);

  return (
    <div style={{ backgroundColor: '#F8FAFF', minHeight: '100vh' }}>
      {/* Header */}
      <div className="text-white py-10 px-4" style={{ background: `linear-gradient(135deg, ${GREEN}, #00C853)` }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-green-100 text-sm mb-1">김밥대장 로드 스탬프</p>
          <div style={{ fontWeight: 900 }}>
            <span className="text-5xl" style={{ color: '#FFD740' }}>{stampCount}</span>
            <span className="text-2xl text-green-200"> / 10개</span>
          </div>

          {stampCount === 0 && (
            <p className="text-green-100 mt-2">아직 스탬프가 없어요. 김밥대장 맛집을 방문해 보세요! 🍙</p>
          )}
          {stampCount > 0 && stampCount < 10 && nextMilestone && (
            <p className="text-green-100 mt-2">
              {nextMilestone.emoji} {nextMilestone.label}까지
              <span className="font-black" style={{ color: '#FFD740' }}> {nextMilestone.count - stampCount}개</span> 남았어요!
            </p>
          )}
          {stampCount >= 10 && (
            <p className="font-black text-xl mt-2" style={{ color: '#FFD740' }}>🎉 모든 스탬프 완주! 그랜드 리워드에 도전하세요!</p>
          )}

          {/* Progress bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="relative w-full rounded-full h-3 mb-2" style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <motion.div className="h-3 rounded-full" style={{ backgroundColor: '#FFD740' }}
                initial={{ width: 0 }} animate={{ width: `${(stampCount / 10) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }} />
              {/* Milestone markers */}
              {PROGRESS_MARKERS.slice(1).map((n) => (
                <div key={n} className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 border-white"
                  style={{
                    left: `${(n / 10) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: stampCount >= n ? '#FFD740' : 'rgba(255,255,255,0.3)',
                  }} />
              ))}
            </div>
            <div className="flex justify-between text-xs text-green-200 mt-1 px-0.5">
              {PROGRESS_MARKERS.map((n) => (
                <span key={n} style={{ fontSize: '10px' }}>
                  {n === 0 ? '0' : n === 4 ? '4👕' : n === 7 ? '7🚂' : n === 10 ? '10🏆' : `${n}`}
                </span>
              ))}
            </div>
          </div>

          {/* Special entry badges earned */}
          {(entries.tshirt77 || entries.korail) && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
              {entries.tshirt77 && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black"
                  style={{ backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fff' }}>
                  👕 티셔츠 응모 완료
                </div>
              )}
              {entries.korail && (
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black"
                  style={{ backgroundColor: 'rgba(232,160,0,0.2)', border: '1px solid rgba(232,160,0,0.4)', color: '#fff' }}>
                  🚂 코레일 응모 완료
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Special Entry Info Banner */}
        <div className="mb-5 p-4 rounded-2xl border-2" style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">🎟️</span>
            <div>
              <p className="font-black text-sm" style={{ color: '#92400E' }}>스탬프 특별 응모권 안내</p>
              <div className="mt-1 space-y-0.5">
                <p className="text-xs" style={{ color: '#B45309' }}>
                  <span className="font-black">4번째 스탬프</span> 달성 시 → 👕 한정판 티셔츠 <span className="font-black">77명 추첨</span> 응모권 자동 등록!
                </p>
                <p className="text-xs" style={{ color: '#B45309' }}>
                  <span className="font-black">7번째 스탬프</span> 달성 시 → 🚂 코레일 기차 여행권 추첨 응모권 자동 등록!
                </p>
              </div>
              {!user && (
                <p className="text-xs mt-1.5 font-black" style={{ color: '#EF4444' }}>
                  ⚠️ 응모권 혜택은 로그인 후 이용 가능합니다.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stamp Board */}
        <div className="bg-white rounded-3xl shadow-sm border-2 p-5 mb-5" style={{ borderColor: '#F3F4F6' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 style={{ fontWeight: 900, fontSize: '16px', color: '#111827' }}>🎯 스탬프 보드</h2>
            <button onClick={() => setShowReset(true)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <RotateCcw size={12} /> 초기화
            </button>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {[...Array(10)].map((_, idx) => {
              const store = stores[idx];
              const collected = store && isCollected(store.id);
              const slotNum = idx + 1;
              const isSpecialSlot = slotNum === 4 || slotNum === 7;
              const specialColor = slotNum === 4 ? '#EF4444' : '#E8A000';
              const specialEmoji = slotNum === 4 ? '👕' : '🚂';
              return (
                <motion.div key={idx} initial={{ scale: 0.85 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-1">
                  <div className="relative w-full rounded-2xl border-2 flex flex-col items-center justify-center transition-all"
                    style={{
                      aspectRatio: '1/1',
                      borderStyle: collected ? 'solid' : isSpecialSlot ? 'solid' : 'dashed',
                      borderColor: collected ? GREEN : isSpecialSlot ? specialColor : '#D1D5DB',
                      background: collected
                        ? 'linear-gradient(135deg,#2BAE4E,#00C853)'
                        : isSpecialSlot
                        ? (slotNum === 4
                          ? 'linear-gradient(135deg,#FEF2F2,#FEE2E2)'
                          : 'linear-gradient(135deg,#FFFBEB,#FEF3C7)')
                        : '#F9FAFB',
                    }}>
                    {collected ? (
                      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                        className="flex flex-col items-center">
                        <span className="text-xl leading-none">🥤</span>
                        <span className="text-white text-xs font-black mt-0.5">✓</span>
                      </motion.div>
                    ) : isSpecialSlot ? (
                      <div className="flex flex-col items-center">
                        <span className="text-xl leading-none">{specialEmoji}</span>
                        <span className="text-xs font-black mt-0.5" style={{ color: specialColor, fontSize: '7px' }}>응모권</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="text-gray-300 text-base">○</span>
                        <span className="text-xs text-gray-300">{idx + 1}</span>
                      </div>
                    )}
                    {/* Milestone badge */}
                    {[2, 5, 10].includes(slotNum) && (
                      <div className="absolute -top-2 -right-2 text-sm">
                        {slotNum === 2 ? '🥤' : slotNum === 5 ? '🎁' : '🏆'}
                      </div>
                    )}
                    {isSpecialSlot && (
                      <div className="absolute -top-2 -right-2 text-sm">{specialEmoji}</div>
                    )}
                  </div>
                  <span className="text-center w-full" style={{ fontSize: '8px', color: isSpecialSlot ? specialColor : '#9CA3AF', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSpecialSlot ? 700 : 400 }}>
                    {isSpecialSlot ? (slotNum === 4 ? '티셔츠' : '코레일') : store?.district}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Visited stores */}
        {collectedStamps.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border-2 p-5 mb-5" style={{ borderColor: '#F3F4F6' }}>
            <h2 className="mb-4" style={{ fontWeight: 900, fontSize: '16px', color: '#111827' }}>
              🥤 방문한 김밥집 ({collectedStamps.length}곳)
            </h2>
            <div className="space-y-2">
              {stores.filter((s) => isCollected(s.id)).map((store, i) => (
                <motion.div key={store.id} initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-2xl border-2"
                  style={{ backgroundColor: GREEN_BG, borderColor: '#BBF7D0' }}>
                  <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0">
                    <img src={store.image} alt={store.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">👑</span>
                      <p className="truncate font-black text-sm text-gray-900">{store.name}</p>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: '11px', color: '#9CA3AF' }}>
                      <MapPin size={10} /><span>{store.district}</span>
                    </div>
                  </div>
                  <span className="text-xl shrink-0">🥤</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Milestones & Rewards */}
        <div className="bg-white rounded-3xl shadow-sm border-2 p-5 mb-5" style={{ borderColor: '#F3F4F6' }}>
          <h2 className="mb-4" style={{ fontWeight: 900, fontSize: '16px', color: '#111827' }}>🏆 리워드 & 응모권 달성 현황</h2>
          <div className="space-y-2.5">
            {MILESTONES.map((m) => {
              const reached = stampCount >= m.count;
              const entryRegistered = m.isSpecialEntry
                ? (m.entryKey === 'tshirt77' ? !!entries.tshirt77 : !!entries.korail)
                : false;

              return (
                <div key={m.count} className="flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all"
                  style={{ borderColor: reached ? m.color : '#F3F4F6', backgroundColor: reached ? m.bg : '#FAFAFA' }}>
                  <div className="text-2xl shrink-0">{m.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm" style={{ color: reached ? m.color : '#9CA3AF' }}>{m.label}</span>
                      <span className="text-xs text-gray-300">{m.count}개 체크인</span>
                      {m.isSpecialEntry && m.badge && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-black"
                          style={{ backgroundColor: m.color + '20', color: m.color }}>
                          {m.badge}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500 mt-0.5">{m.prize}</p>
                  </div>
                  {reached ? (
                    m.isSpecialEntry ? (
                      <div className="shrink-0 text-right">
                        {entryRegistered ? (
                          <span className="text-xs px-2.5 py-1 rounded-full text-white font-black" style={{ backgroundColor: m.color }}>
                            응모 완료 ✓
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {user ? '처리 중...' : '로그인 필요'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full text-white font-black shrink-0"
                        style={{ backgroundColor: m.color }}>달성! ✓</span>
                    )
                  ) : (
                    <span className="text-xs text-gray-400 shrink-0">{m.count - stampCount}개 남음</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* My Entries Card (when logged in and has entries) */}
        {user && (entries.tshirt77 || entries.korail) && (
          <div className="bg-white rounded-3xl shadow-sm border-2 p-5 mb-5" style={{ borderColor: '#FCD34D' }}>
            <h2 className="mb-3" style={{ fontWeight: 900, fontSize: '16px', color: '#92400E' }}>🎟️ 내 응모권 현황</h2>
            <div className="space-y-2.5">
              {entries.tshirt77 && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2"
                  style={{ backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}>
                  <span className="text-3xl shrink-0">👕</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm" style={{ color: '#EF4444' }}>한정판 티셔츠 77명 추첨 응모권</p>
                    <p className="text-xs text-gray-500 mt-0.5">칠성사이다 × 김밥대장 콜라보 한정판</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      등록: {new Date(entries.tshirt77.registeredAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full text-white font-black" style={{ backgroundColor: '#EF4444' }}>등록됨 ✓</span>
                  </div>
                </div>
              )}
              {entries.korail && (
                <div className="flex items-center gap-3 p-3.5 rounded-2xl border-2"
                  style={{ backgroundColor: '#FFFBEB', borderColor: '#FCD34D' }}>
                  <span className="text-3xl shrink-0">🚂</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm" style={{ color: '#E8A000' }}>코레일 기차 여행권 추첨 응모권</p>
                    <p className="text-xs text-gray-500 mt-0.5">KTX 포함 전국 기차 여행권</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      등록: {new Date(entries.korail.registeredAt).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs px-2.5 py-1 rounded-full text-white font-black" style={{ backgroundColor: '#E8A000' }}>등록됨 ✓</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/map"
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black hover:opacity-90"
            style={{ backgroundColor: GREEN }}>
            <MapPin size={17} /> 김밥집 방문하기 <ChevronRight size={15} />
          </Link>
          {stampCount >= 2 && (
            <Link to="/prizes"
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-black hover:opacity-90"
              style={{ backgroundColor: '#0057B8' }}>
              <Gift size={17} /> 리워드 받기 <ChevronRight size={15} />
            </Link>
          )}
        </div>

        {/* Empty state */}
        {stampCount === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍙</div>
            <h3 className="text-gray-800 mb-2" style={{ fontWeight: 900, fontSize: '20px' }}>아직 방문한 김밥집이 없어요</h3>
            <p className="text-gray-500 text-sm mb-6">칠성 김밥 로드 지도에서 김밥집을 찾아보세요!</p>
            <Link to="/map"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-black hover:opacity-90"
              style={{ backgroundColor: GREEN }}>
              <MapPin size={17} /> 김밥 지도 보기
            </Link>
          </div>
        )}
      </div>

      {/* New Entry Alert Modal */}
      <AnimatePresence>
        {entryAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setEntryAlert(null)} />
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center overflow-hidden"
            >
              {/* Confetti BG */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <motion.div key={i}
                    className="absolute w-3 h-3 rounded-full opacity-30"
                    style={{
                      backgroundColor: i % 3 === 0 ? '#FFD740' : i % 3 === 1 ? '#2BAE4E' : '#EF4444',
                      left: `${10 + i * 11}%`,
                      top: `${Math.random() * 40}%`,
                    }}
                    animate={{ y: [0, 60], opacity: [0.3, 0] }}
                    transition={{ duration: 1.5, delay: i * 0.1, repeat: Infinity }}
                  />
                ))}
              </div>
              <motion.div
                className="text-6xl mb-3"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, delay: 0.15 }}
              >
                {entryAlert.emoji}
              </motion.div>
              <div className="inline-block px-3 py-1 rounded-full text-xs font-black mb-3"
                style={{ backgroundColor: '#FFD74020', color: '#B45309' }}>
                🎟️ 응모권 자동 등록 완료!
              </div>
              <h3 className="text-gray-900 text-xl mb-2" style={{ fontWeight: 900 }}>
                {entryAlert.title}
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                축하해요! 추첨 응모권이 자동으로 등록되었어요.<br />
                당첨 결과는 캠페인 종료 후 공지됩니다.
              </p>
              <button
                onClick={() => setEntryAlert(null)}
                className="w-full py-3.5 rounded-xl text-white font-black"
                style={{ backgroundColor: GREEN }}
              >
                확인했어요 🎉
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset modal */}
      <AnimatePresence>
        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowReset(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full text-center">
              <div className="text-4xl mb-4">⚠️</div>
              <h3 className="text-gray-900 mb-2" style={{ fontWeight: 900, fontSize: '20px' }}>스탬프를 초기화할까요?</h3>
              <p className="text-gray-500 text-sm mb-6">데모 테스트용 초기화 기능입니다.<br />응모권도 함께 초기화됩니다.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowReset(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-700 font-black">취소</button>
                <button onClick={() => { resetStamps(); setShowReset(false); }}
                  className="flex-1 py-3 rounded-2xl text-white font-black" style={{ backgroundColor: '#EF4444' }}>초기화</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
