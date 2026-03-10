import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { LogOut, MapPin, Stamp, Gift, ChevronRight, Trash2, User, Mail, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useStamp } from '../context/StampContext';

const GREEN = '#2BAE4E';
const YELLOW = '#FFD740';
const STAMP_KEY = 'chilsung-stamps';
const SESSION_KEY = 'chilsung-auth-session';
const DEVICE_ID_KEY = 'chilsung-device-id';

export function MyPage() {
  const { user, signOut } = useAuth();
  const { stampCount, resetStamps } = useStamp();
  const navigate = useNavigate();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '게스트';
  const initials = displayName.slice(0, 1).toUpperCase();
  const isGuest = !user;

  const handleSignOut = () => { signOut(); navigate('/'); };

  const handleClearCache = () => {
    localStorage.removeItem(STAMP_KEY);
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(DEVICE_ID_KEY);
    resetStamps();
    setShowClearConfirm(false);
    signOut();
    navigate('/');
  };

  return (
    <div style={{ backgroundColor: '#F8FAFF', minHeight: '100vh' }}>

      {/* Header */}
      <div className="text-white py-8 px-4" style={{ background: `linear-gradient(135deg,${GREEN},#00C853)` }}>
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
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

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

        {/* Account Info */}
        {user && (
          <div className="bg-white rounded-3xl border-2 overflow-hidden mb-4" style={{ borderColor: '#F3F4F6' }}>
            <div className="px-5 py-3 border-b" style={{ borderColor: '#F3F4F6' }}>
              <p className="text-sm font-black text-gray-900">👤 계정 정보</p>
            </div>
            <div className="divide-y" style={{ borderColor: '#F3F4F6' }}>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <User size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">닉네임</p>
                  <p className="text-sm font-black text-gray-900">{displayName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Mail size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">이메일</p>
                  <p className="text-sm font-black text-gray-900">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Shield size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">로그인 방식</p>
                  <p className="text-sm font-black text-gray-900">
                    {user.user_metadata?.provider === 'naver' ? '네이버 소셜 로그인'
                      : user.user_metadata?.provider === 'kakao' ? '카카오 소셜 로그인'
                      : '이메일 로그인'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3.5">
                <Stamp size={16} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400">참여 현황</p>
                  <p className="text-sm font-black text-gray-900">스탬프 {stampCount}/10개 적립</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Cards */}
        <div className="space-y-3 mb-4">
          <Link to="/rewards"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 hover:bg-gray-50 transition-colors"
            style={{ borderColor: YELLOW + '60' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${YELLOW}, #FFA000)` }}>
              <Gift size={22} color="#1a1a1a" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900">내 리워드</p>
              <p className="text-xs text-gray-400">증정권 확인 · 룰렛 참여 이력</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </Link>

          <Link to="/stamps"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#F3F4F6' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#E8F8EF' }}>
              <Stamp size={22} color={GREEN} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900">스탬프 현황</p>
              <p className="text-xs text-gray-400">{stampCount}/10개 · 다음 리워드까지 {Math.max(0, ([4, 7, 10].find(n => n > stampCount) ?? 10) - stampCount)}개</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </Link>

          <Link to="/prizes"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#F3F4F6' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
              <span className="text-xl">🏆</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900">리워드 안내</p>
              <p className="text-xs text-gray-400">티셔츠 · 코레일 해랑열차</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </Link>

          <Link to="/map"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border-2 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#F3F4F6' }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#EFF6FF' }}>
              <MapPin size={22} color="#0057B8" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-sm text-gray-900">매장 찾기</p>
              <p className="text-xs text-gray-400">김밥대장 추천 맛집 지도</p>
            </div>
            <ChevronRight size={18} className="text-gray-300 shrink-0" />
          </Link>
        </div>

        {/* Data reset */}
        <div className="mt-4">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-xs font-black transition-colors hover:bg-red-50"
              style={{ borderColor: '#FCA5A5', color: '#EF4444' }}
            >
              <Trash2 size={13} /> 참여 데이터 초기화
            </button>
          ) : (
            <div className="rounded-2xl border-2 p-4" style={{ borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }}>
              <p className="text-xs font-black text-red-500 mb-1">정말 초기화하시겠어요?</p>
              <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                스탬프, 증정권, 룰렛 참여 기록, 로그인 세션이 모두 삭제됩니다.
                <br />이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black border-2 border-gray-200 text-gray-500 bg-white"
                >
                  취소
                </button>
                <button
                  onClick={handleClearCache}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center gap-1.5"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  <Trash2 size={12} /> 초기화 실행
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-5">
          <p className="text-xs text-gray-400">칠성사이다 × 김밥대장 스탬프 투어 2026</p>
          <p className="text-xs text-gray-300 mt-0.5">데모 환경 · 실제 경품 미지급</p>
        </div>
      </div>
    </div>
  );
}