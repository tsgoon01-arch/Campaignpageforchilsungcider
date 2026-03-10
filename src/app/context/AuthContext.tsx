import React, { createContext, useContext, useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// ── Supabase Auth REST API (no client library needed) ─────────────────────────
const AUTH_URL = `https://${projectId}.supabase.co/auth/v1`;
const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const SESSION_KEY = 'chilsung-auth-session';

interface SessionUser {
  id: string;
  email: string;
  user_metadata: { name?: string };
}

interface StoredSession {
  access_token: string;
  user: SessionUser;
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

// Persist context across HMR re-evaluations so the same object is reused
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
    return null;
  }
}

function saveSession(session: StoredSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const session = loadSession();
    if (session) {
      setUser(session.user);
      setAccessToken(session.access_token);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      const res = await fetch(`${AUTH_URL}/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': publicAnonKey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error('Sign in error:', data.error_description || data.error);
        if (data.error_description?.includes('Invalid login') || data.error?.includes('invalid')) {
          return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
        }
        return { error: data.error_description || data.error || '로그인에 실패했습니다.' };
      }

      const sessionUser: SessionUser = {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata || {},
      };
      const stored: StoredSession = { access_token: data.access_token, user: sessionUser };
      saveSession(stored);
      setUser(sessionUser);
      setAccessToken(data.access_token);
      return {};
    } catch (err) {
      console.error('Sign in exception:', err);
      return { error: `네트워크 오류가 발생했습니다: ${err}` };
    }
  };

  const signInSocial = async (provider: 'naver' | 'kakao'): Promise<{ error?: string }> => {
    try {
      const providerName = provider === 'naver' ? '네이버' : '카카오';
      const res = await fetch(`${SERVER_URL}/auth/social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ provider, demoName: `${providerName} 데모 유저` }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        console.error('Social sign in error:', data.error);
        return { error: data.error || `${providerName} 로그인에 실패했습니다.` };
      }

      const sessionUser: SessionUser = {
        id: data.user?.id,
        email: data.user?.email,
        user_metadata: data.user?.user_metadata || {},
      };
      const stored: StoredSession = { access_token: data.access_token, user: sessionUser };
      saveSession(stored);
      setUser(sessionUser);
      setAccessToken(data.access_token);
      return {};
    } catch (err) {
      console.error('Social sign in exception:', err);
      return { error: `네트워크 오류가 발생했습니다: ${err}` };
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<{ error?: string }> => {
    try {
      // Use server-side signup (admin API with email_confirm: true)
      const res = await fetch(`${SERVER_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Sign up error:', data.error);
        return { error: data.error || '회원가입에 실패했습니다.' };
      }

      // Auto sign-in after signup
      const signInResult = await signIn(email, password);
      if (signInResult.error) {
        return { error: '가입 완료! 로그인 페이지에서 로그인해주세요.' };
      }
      return {};
    } catch (err) {
      console.error('Sign up exception:', err);
      return { error: `서버 오류가 발생했습니다: ${err}` };
    }
  };

  const signOut = () => {
    clearSession();
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInSocial, signOut, accessToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}