import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  agree: boolean;
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

export function SignupPage() {
  const { signUp, signInSocial } = useAuth();
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'naver' | 'kakao' | null>(null);
  const [done, setDone] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupForm>();
  const pw = watch('password');

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true);
    setServerError('');
    const result = await signUp(data.email, data.password, data.name);
    setIsLoading(false);
    if (result.error) {
      setServerError(result.error);
    } else {
      setDone(true);
      setTimeout(() => navigate('/'), 1800);
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
      navigate('/');
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg,#E8F8EF 0%,#F0FDF4 50%,#EBF4FF 100%)' }}>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-sm w-full mx-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#E8F8EF' }}>
            <CheckCircle2 size={48} color={GREEN} />
          </motion.div>
          <h2 className="text-gray-900 mb-2" style={{ fontWeight: 900, fontSize: '22px' }}>가입 완료! 🎉</h2>
          <p className="text-gray-500 text-sm">스탬프 투어를 시작해봐요!</p>
          <div className="mt-4 flex justify-center">
            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: GREEN }} />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(160deg,#E8F8EF 0%,#F0FDF4 50%,#EBF4FF 100%)' }}
    >
      {/* Decorations */}
      <div className="absolute top-0 right-0 w-56 h-56 rounded-full opacity-25 pointer-events-none translate-x-28 -translate-y-28"
        style={{ backgroundColor: GREEN }} />
      <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full opacity-20 pointer-events-none -translate-x-20 translate-y-20"
        style={{ backgroundColor: '#0057B8' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Top banner */}
        <div className="px-8 pt-8 pb-6 text-center" style={{ background: `linear-gradient(135deg,${GREEN},#00C853)` }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 bg-white/20 backdrop-blur-sm">
            <span className="text-white text-2xl" style={{ fontWeight: 900 }}>七</span>
          </div>
          <h1 className="text-white" style={{ fontWeight: 900, fontSize: '22px' }}>회원가입</h1>
          <p className="text-green-100 text-sm mt-1">무료로 가입하고 스탬프를 모아보세요!</p>
        </div>

        <div className="px-8 py-7">
          {serverError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              ⚠️ {serverError}
            </motion.div>
          )}

          {/* Social Login */}
          <div className="space-y-3 mb-5">
            <button
              onClick={() => handleSocialLogin('naver')}
              disabled={!!socialLoading || isLoading}
              className="w-full py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: NAVER_GREEN, fontWeight: 700, fontSize: '15px', color: 'white' }}
            >
              {socialLoading === 'naver' ? <Loader2 size={18} className="animate-spin" /> : <NaverLogo />}
              네이버로 시작하기
            </button>
            <button
              onClick={() => handleSocialLogin('kakao')}
              disabled={!!socialLoading || isLoading}
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
            <span className="text-xs text-gray-400">또는 이메일로 가입</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>이름 (닉네임)</label>
              <input
                type="text"
                placeholder="홍길동"
                className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-all"
                style={{ borderColor: errors.name ? '#EF4444' : '#E5E7EB', backgroundColor: '#FAFAFA' }}
                onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.backgroundColor = '#fff'; }}
                onBlur={(e) => { e.target.style.borderColor = errors.name ? '#EF4444' : '#E5E7EB'; e.target.style.backgroundColor = '#FAFAFA'; }}
                {...register('name', {
                  required: '이름을 입력해주세요.',
                  minLength: { value: 2, message: '이름은 최소 2자 이상이어야 합니다.' },
                })}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>이메일</label>
              <input
                type="email"
                placeholder="example@email.com"
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

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>비밀번호</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="6자 이상 입력"
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm text-gray-700 mb-1.5" style={{ fontWeight: 600 }}>비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showPw2 ? 'text' : 'password'}
                  placeholder="비밀번호 재입력"
                  className="w-full px-4 py-3 pr-12 rounded-xl border-2 text-sm outline-none transition-all"
                  style={{ borderColor: errors.passwordConfirm ? '#EF4444' : '#E5E7EB', backgroundColor: '#FAFAFA' }}
                  onFocus={(e) => { e.target.style.borderColor = GREEN; e.target.style.backgroundColor = '#fff'; }}
                  onBlur={(e) => { e.target.style.borderColor = errors.passwordConfirm ? '#EF4444' : '#E5E7EB'; e.target.style.backgroundColor = '#FAFAFA'; }}
                  {...register('passwordConfirm', {
                    required: '비밀번호를 다시 입력해주세요.',
                    validate: (v) => v === pw || '비밀번호가 일치하지 않습니다.',
                  })}
                />
                <button type="button" onClick={() => setShowPw2(!showPw2)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw2 ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.passwordConfirm && <p className="mt-1 text-xs text-red-500">{errors.passwordConfirm.message}</p>}
            </div>

            {/* Agree */}
            <div className="flex items-start gap-2.5">
              <input type="checkbox" id="agree" className="mt-0.5 w-4 h-4 accent-green-500 shrink-0 cursor-pointer"
                {...register('agree', { required: '이용약관에 동의해주세요.' })} />
              <label htmlFor="agree" className="text-xs text-gray-500 cursor-pointer leading-relaxed">
                <span style={{ fontWeight: 600 }}>이용약관</span> 및 <span style={{ fontWeight: 600 }}>개인정보처리방침</span>에 동의합니다.
                (본 데모 서비스에서 수집된 정보는 테스트 목적으로만 사용됩니다.)
              </label>
            </div>
            {errors.agree && <p className="text-xs text-red-500 -mt-2">{errors.agree.message}</p>}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl text-white flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60 mt-1"
              style={{ backgroundColor: GREEN, fontWeight: 700, fontSize: '15px' }}
            >
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> 가입 중...</> : '🎉 무료 회원가입'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 mt-5">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-black hover:underline" style={{ color: GREEN }}>
              로그인
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}