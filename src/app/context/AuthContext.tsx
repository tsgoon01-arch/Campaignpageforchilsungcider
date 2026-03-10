import React, { createContext, useContext, useState, useEffect } from 'react';

// ── Demo Auth (서버 호출 없이 로컬 세션만 사용) ──────────────────────────────
const SESSION_KEY = 'chilsung-auth-session';

interface SessionUser {
  id: string;
  email: string;
  user_metadata: { name?: string; provider?: string };
}

interface StoredSession {
  user: SessionUser;
  access_token?: string; // 데모 환경에서도 다른 페이지의 isLoggedIn() 체크를 위해 포함
}

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>;
  signInSocial: (provider: 'naver' | 'kakao') => Promise<{ error?: string }>;
  signOut: () => void;
  accessToken: string | null;
}

// Persist context across HMR re-evaluations
const AUTH_CTX_KEY = '__chilsung_auth_ctx__';
if (!(globalThis as any)[AUTH_CTX_KEY]) {
  (globalThis as any)[AUTH_CTX_KEY] = createContext<AuthContextType | null>(null);
}
const AuthContext = (globalThis as any)[AUTH_CTX_KEY] as React.Context<AuthContextType | null>;
export { AuthContext };

// ── Local session helpers ─────────────────────────────────────────────────────
function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

/** 데모 유저 ID 생성 */
function generateDemoId(): string {
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Restore session on mount ────────────────────────────────────────────────
  useEffect(() => {
    const session = loadSession();
    if (session?.user) {
      setUser(session.user);
    }
    setLoading(false);
  }, []);

  // ── 데모 로그인 helper ──────────────────────────────────────────────────────
  const demoLogin = (demoUser: SessionUser) => {
    saveSession({ user: demoUser, access_token: 'demo-token' });
    setUser(demoUser);
  };

  // ── Sign In (이메일 — 데모: 서버 호출 없이 즉시 로그인) ─────────────────────
  const signIn = async (email: string, _password: string): Promise<{ error?: string }> => {
    const name = email.split('@')[0];
    demoLogin({
      id: generateDemoId(),
      email,
      user_metadata: { name },
    });
    return {};
  };

  // ── Sign Up (데모: 즉시 가입 + 로그인) ──────────────────────────────────────
  const signUp = async (email: string, _password: string, name: string): Promise<{ error?: string }> => {
    demoLogin({
      id: generateDemoId(),
      email,
      user_metadata: { name },
    });
    return {};
  };

  // ── Social Sign In (데모: 네이버/카카오 즉시 로그인) ─────────────────────────
  const signInSocial = async (provider: 'naver' | 'kakao'): Promise<{ error?: string }> => {
    const providerName = provider === 'naver' ? '네이버' : '카카오';
    const displayName = `${providerName} 유저`;
    demoLogin({
      id: generateDemoId(),
      email: `${provider}_user@demo.chilsung.kr`,
      user_metadata: { name: displayName, provider },
    });
    return {};
  };

  // ── Sign Out ────────────────────────────────────────────────────────────────
  const signOut = () => {
    clearSession();
    setUser(null);
  };

  // accessToken은 항상 null → 서버 호출 대신 localStorage 폴백 사용
  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInSocial, signOut, accessToken: null }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}