import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const PENDING_PRIZE_KEY = 'pending-roulette-prize';
const SESSION_KEY = 'chilsung-auth-session';

interface LoginForm {
  email: string;
  password: string;
}

const GREEN = '#2BAE4E';
const NAVER_GREEN = '#03C75A';
const KAKAO_YELLOW = '#FEE500';

function NaverLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M13.4 12.22L10.08 7H7v10h3.6v-5.22L14 17H17V7h-3.6v5.22z" fill="white" />
    </svg>
  );
}

function KakaoLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3C7.03 3 3 6.14 3 10C3 12.44 4.56 14.6 6.98 15.94L6 21l5.02-3.28C11.33 17.9 11.66 18 12 18c4.97 0 9-3.14 9-7s-4.03-8-9-8z"
        fill="#3C1E1E"
      />
    </svg>
  );
}

// ── Claim pending prizes from sessionStorage ──────────────────────────────────
async function claimPendingPrizes(accessToken: string) {
  try {
    const raw = sessionStorage.getItem(PENDING_PRIZE_KEY);
    if (!raw) return;
    const pending: object[] = JSON.parse(raw);
    if (!pending.length) return;

    const results = await Promise.allSettled(
      pending.map((prize) =>
        fetch(`${SERVER_URL}/roulette/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(prize),
        }).then((r) => r.json())
      )
    );

    const claimed = results.filter((r) => r.status === 'fulfilled').length;
    console.log(`Claimed ${claimed} pending prize(s)`);
    sessionStorage.removeItem(PENDING_PRIZE_KEY);
  } catch (err) {
    console.error('Failed to claim pending prizes:', err);
  }
}

export function LoginPage() {
  const { signIn, signInSocial } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPw, setShowPw] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'naver' | 'kakao' | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [claimStatus, setClaimStatus] = useState('');

  const returnPath = searchParams.get('return') || '/';
  const hasClaim = searchParams.get('claim') === '1';
  const hasPendingPrize = !!sessionStorage.getItem(PENDING_PRIZE_KEY);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const afterLogin = async () => {
    // Check pending prizes
    if (hasPendingPrize) {
      setClaimStatus('교환권 등록 중...');
      // Get fresh token from localStorage
      const raw = localStorage.getItem(SESSION_KEY);
      const token = raw ? JSON.parse(raw)?.access_token : null;
      if (token) {
        await claimPendingPrizes(token);
        setClaimStatus('교환권 등록 완료! 마이페이지로 이동합니다...');
        setTimeout(() => navigate(returnPath), 800);
        return;
      }
    }
    navigate(returnPath);
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setServerError('');
    const result = await signIn(data.email, data.password);
    setIsLoading(false);
    if (result.error) {
      setServerError(result.error);
    } else {
      await afterLogin();
    }
  };

  const handleSocialLogin = async (provider: 'naver' | 'kakao') => {
    setSocialLoading(provider);
    setServerError('');
    const result = await signInSocial(provider);
    setSocialLoading(null);
    if (result.error) {
      setServerError(result.error);
    } else {
      await afterLogin();
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(160deg,#E8F8EF 0%,#F0FDF4 50%,#EBF4FF 100%)' }}
    >
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-30 pointer-events-none -translate-x-32 -translate-y-32"
        style={{ backgroundColor: '#2BAE4E' }} />
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full opacity-20 pointer-events-none translate-x-24 translate-y-24"
        style={{ backgroundColor: '#0057B8' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Top banner */}
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg,${GREEN},#00C853)` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg bg-white/20 backdrop-blur-sm">
            <span className="text-white text-2xl" style={{ fontWeight: 900 }}>七</span>
          </div>
          <h1 className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>칠성사이다 스탬프 투어</h1>
          <p className="text-green-100 text-sm mt-1">로그인하고 스탬프를 모아보세요!</p>
        </div>

        <div className="px-8 py-7">
          {/* Pending prize notice */}
          {(hasClaim || hasPendingPrize) && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm"
              style={{ backgroundColor: '#FFFBEB', border: '1.5px solid #FCD34D' }}>
              <p className="font-black text-sm mb-0.5" style={{ color: '#92400E' }}>🎫 교환권 대기 중!</p>
              <p className="text-xs text-gray-500">로그인하면 룰렛 당첨 교환권이 자동으로 발급됩니다.</p>
            </motion.div>
          )}

          {/* Claim status */}
          {claimStatus && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm text-center font-black"
              style={{ backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', color: GREEN }}>
              ✅ {claimStatus}
            </motion.div>
          )}

          {serverError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠️ {serverError}
            </motion.div>
          )}

          {/* Social Login */}
          <div className="space-y-3 mb-4">
            <button
              onClick={() => handleSocialLogin('naver')}
              disabled={!!socialLoading || isLoading || !!claimStatus}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: NAVER_GREEN, fontWeight: 700, fontSize: '15px', color: 'white' }}
            >
              {socialLoading === 'naver' ? <Loader2 size={18} className="animate-spin" /> : <NaverLogo />}
              네이버로 시작하기
            </button>

            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={!!socialLoading || isLoading || !!claimStatus}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: KAKAO_YELLOW, fontWeight: 700, fontSize: '15px', color: '#3C1E1E' }}
            >
              {socialLoading === 'kakao' ? <Loader2 size={18} className="animate-spin" style={{ color: '#3C1E1E' }} /> : <KakaoLogo />}
              카카오로 시작하기
            </button>
          </div>

          {/* Demo notice */}
          <div className="mb-4 px-3 py-2 rounded-xl text-xs text-center"
            style={{ backgroundColor: '#FFF9E6', color: '#92400E', border: '1px solid #FCD34D' }}>
            💡 데모 환경: 간편 로그인은 테스트 계정으로 처리됩니다.
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">또는</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email Login toggle */}
          <button
            type="button"
            onClick={() => setShowEmailForm(!showEmailForm)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors mb-3"
            style={{ borderColor: '#E5E7EB', fontWeight: 600 }}
          >
            📧 이메일로 로그인
            {showEmailForm ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <motion.div
            initial={false}
            animate={{ height: showEmailForm ? 'auto' : 0, opacity: showEmailForm ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>이메일</label>
                <input
                  type="email" placeholder="example@email.com"
                  className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                  style={{ borderColor: errors.email ? '#EF4444' : '#E5E7EB', backgroundColor: '#FAFAFA' }}
                  onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.email ? '#EF4444' : '#E5E7EB'; e.target.style.backgroundColor = '#FAFAFA'; }}
                  {...register('email', {
                    required: '이메일을 입력해주세요.',
                    pattern: { value: /\S+@\S+\.\S+/, message: '올바른 이메일 형식을 입력해주세요.' },
                  })}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>비밀번호</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'} placeholder="비밀번호 입력"
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 text-sm outline-none transition-all"
                    style={{ borderColor: errors.password ? '#EF4444' : '#E5E7EB', backgroundColor: '#FAFAFA' }}
                    onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.backgroundColor = '#fff'; }}
                    onBlur={(e) => { e.target.style.borderColor = errors.password ? '#EF4444' : '#E5E7EB'; e.target.style.backgroundColor = '#FAFAFA'; }}
                    {...register('password', {
                      required: '비밀번호를 입력해주세요.',
                      minLength: { value: 6, message: '비밀번호는 최소 6자 이상이어야 합니다.' },
                    })}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
              </div>

              <button type="submit" disabled={isLoading || !!claimStatus}
                className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: GREEN, fontWeight: 700, fontSize: '15px' }}>
                {isLoading ? <><Loader2 size={18} className="animate-spin" /> 로그인 중...</> : '🔐 이메일 로그인'}
              </button>
            </form>
          </motion.div>

          {/* Guest */}
          <Link to="/" className="block w-full py-3 rounded-xl border-2 text-center text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            style={{ borderColor: '#E5E7EB', fontWeight: 600 }}>
            🚶 게스트로 시작하기 (비회원)
          </Link>

          <p className="text-center text-sm text-gray-500 mt-5">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="font-black hover:underline" style={{ color: GREEN }}>회원가입</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
