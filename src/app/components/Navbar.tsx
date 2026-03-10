import { Link, useLocation } from 'react-router';
import { MapPin, Gift, Home, Menu, X, Stamp, LogOut, User, LogIn, UserCircle2 } from 'lucide-react';
import { useState } from 'react';
import { useStamp } from '../context/StampContext';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import chilsungLogo from 'figma:asset/08d441681e4b572c719575a05a82eb624321bfac.png';

const GREEN = '#2BAE4E';

const navItems = [
  { path: '/', label: '홈', icon: Home },
  { path: '/map', label: '칠성 김밥 지도', icon: MapPin },
  { path: '/stamps', label: '내 스탬프', icon: Stamp },
  { path: '/rewards', label: '내 리워드', icon: Gift },
];

export function Navbar() {
  const location = useLocation();
  const { stampCount } = useStamp();
  const { user, signOut, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const displayName = user?.user_metadata?.name || user?.email?.split('@')[0] || '사용자';
  const initials = displayName.slice(0, 1).toUpperCase();
  const isMyPage = location.pathname === '/mypage';

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100" style={{ fontFamily: 'inherit' }}>
      <div className="max-w-6xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: '60px' }}>
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={chilsungLogo}
            alt="칠성사이다"
            style={{ height: '34px', width: 'auto', borderRadius: '8px', display: 'block' }}
          />
          <div style={{ lineHeight: 1.25 }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: '#1A1A1A', letterSpacing: '-0.2px' }}>스탬프 투어</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', letterSpacing: '0.8px' }}>김밥 로드 2026</div>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-0.5">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link key={path} to={path}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors"
                style={active
                  ? { backgroundColor: '#F0FDF4', color: GREEN, fontWeight: 600 }
                  : { color: '#6B7280', fontWeight: 500 }}
              >
                <Icon size={14} />
                {label}
                {path === '/stamps' && stampCount > 0 && (
                  <span className="ml-0.5 text-xs rounded-full w-5 h-5 flex items-center justify-center"
                    style={{ backgroundColor: GREEN, color: '#fff', fontWeight: 700, fontSize: '11px' }}>
                    {stampCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop right: user */}
        <div className="hidden md:flex items-center gap-2">
          {!loading && (
            user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
                  style={{ border: `1.5px solid ${isMyPage ? GREEN : '#E5E7EB'}` }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: GREEN, fontWeight: 700, fontSize: '11px' }}>
                    {initials}
                  </div>
                  <span className="text-sm text-gray-700" style={{ fontWeight: 600 }}>{displayName}</span>
                </button>
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-lg border overflow-hidden"
                      style={{ borderColor: '#F3F4F6', zIndex: 100 }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: '#F9FAFB' }}>
                        <p className="text-xs text-gray-400">로그인 계정</p>
                        <p className="text-sm text-gray-700 truncate" style={{ fontWeight: 600 }}>{user.email}</p>
                      </div>
                      <Link to="/mypage" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        style={isMyPage ? { backgroundColor: '#F0FDF4', color: GREEN } : {}}>
                        <UserCircle2 size={14} /> 마이페이지
                        {((stampCount > 0)) && (
                          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: GREEN, fontWeight: 700, fontSize: '11px' }}>{stampCount}</span>
                        )}
                      </Link>
                      <Link to="/stamps" onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Stamp size={14} /> 내 스탬프 {stampCount > 0 && <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: GREEN, fontWeight: 700, fontSize: '11px' }}>{stampCount}</span>}
                      </Link>
                      <button
                        onClick={() => { signOut(); setShowUserMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} /> 로그아웃
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
                {showUserMenu && (
                  <div className="fixed inset-0 z-[-1]" onClick={() => setShowUserMenu(false)} />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm transition-colors hover:bg-gray-50"
                  style={{ border: '1.5px solid #E5E7EB', color: '#374151', fontWeight: 600 }}>
                  <LogIn size={14} /> 로그인
                </Link>
                <Link to="/signup"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: GREEN, fontWeight: 700 }}>
                  <User size={14} /> 회원가입
                </Link>
              </div>
            )
          )}
        </div>

        {/* Mobile right */}
        <div className="flex items-center gap-2 md:hidden">
          {stampCount > 0 && (
            <Link to="/stamps" className="flex items-center gap-1 px-3 py-1.5 rounded-full text-white text-xs"
              style={{ backgroundColor: GREEN, fontWeight: 700 }}>
              <Stamp size={12} /> {stampCount}/10
            </Link>
          )}
          {user ? (
            <Link to="/mypage"
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: isMyPage ? '#00C853' : GREEN, fontWeight: 700, fontSize: '11px', border: isMyPage ? '2px solid #FFD740' : 'none' }}>
              {initials}
            </Link>
          ) : (
            <Link to="/login" className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
              <LogIn size={18} />
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100">
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-white border-t overflow-hidden"
            style={{ borderColor: '#F3F4F6' }}
          >
            {navItems.map(({ path, label, icon: Icon }) => {
              const active = location.pathname === path;
              return (
                <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-6 py-3.5 border-b text-sm transition-colors"
                  style={{
                    borderColor: '#F9FAFB',
                    color: active ? GREEN : '#374151',
                    backgroundColor: active ? '#F0FDF4' : 'white',
                    fontWeight: active ? 600 : 400,
                  }}>
                  <Icon size={16} />{label}
                  {path === '/stamps' && stampCount > 0 && (
                    <span className="ml-auto text-xs rounded-full w-5 h-5 flex items-center justify-center text-white"
                      style={{ backgroundColor: GREEN, fontWeight: 700, fontSize: '11px' }}>{stampCount}</span>
                  )}
                </Link>
              );
            })}

            {/* Mypage (if logged in) */}
            {user && (
              <Link to="/mypage" onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 px-6 py-3.5 border-b text-sm transition-colors"
                style={{
                  borderColor: '#F9FAFB',
                  color: isMyPage ? GREEN : '#374151',
                  backgroundColor: isMyPage ? '#F0FDF4' : 'white',
                  fontWeight: isMyPage ? 600 : 400,
                }}>
                <UserCircle2 size={16} /> 마이페이지
              </Link>
            )}

            {/* Auth section */}
            <div className="px-4 py-3 border-t" style={{ borderColor: '#F3F4F6' }}>
              {user ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: GREEN, fontWeight: 700 }}>{initials}</div>
                    <div>
                      <p className="text-sm text-gray-800" style={{ fontWeight: 600 }}>{displayName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </div>
                  <button onClick={() => { signOut(); setMenuOpen(false); }}
                    className="flex items-center gap-1 text-xs text-red-500 px-3 py-1.5 rounded-full bg-red-50" style={{ fontWeight: 600 }}>
                    <LogOut size={12} /> 로그아웃
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Link to="/login" onClick={() => setMenuOpen(false)}
                    className="flex-1 py-2.5 text-center rounded-xl text-sm text-gray-700"
                    style={{ border: '1.5px solid #E5E7EB', fontWeight: 600 }}>로그인</Link>
                  <Link to="/signup" onClick={() => setMenuOpen(false)}
                    className="flex-1 py-2.5 text-center rounded-xl text-white text-sm"
                    style={{ backgroundColor: GREEN, fontWeight: 700 }}>회원가입</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}