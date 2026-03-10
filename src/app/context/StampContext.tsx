import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectId } from '/utils/supabase/info';
import { AuthContext } from './AuthContext';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const LOCAL_KEY = 'chilsung-stamps';

interface StampContextType {
  collectedStamps: string[];
  addStamp: (storeId: string) => void;
  resetStamps: () => void;
  isCollected: (storeId: string) => boolean;
  stampCount: number;
  isLoading: boolean;
}

// Persist context across HMR re-evaluations so the same object is reused
const CTX_KEY = '__chilsung_stamp_ctx__';
if (!(globalThis as any)[CTX_KEY]) {
  (globalThis as any)[CTX_KEY] = createContext<StampContextType | null>(null);
}
const StampContext = (globalThis as any)[CTX_KEY] as React.Context<StampContextType | null>;

function loadLocal(): string[] {
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch { return []; }
}
function saveLocal(stamps: string[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(stamps));
}

export function StampProvider({ children }: { children: React.ReactNode }) {
  const auth = useContext(AuthContext);
  const accessToken = auth?.accessToken ?? null;
  const userId = auth?.user?.id ?? null;
  const [collectedStamps, setCollectedStamps] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ── Fetch stamps from server ───────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !userId) {
      setCollectedStamps(loadLocal());
      return;
    }

    setIsLoading(true);
    fetch(`${SERVER_URL}/stamps`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((res) => {
        if (res.status === 401) {
          // Token expired or invalid — clear session and fall back to local
          auth?.signOut?.();
          setCollectedStamps(loadLocal());
          return null;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data) setCollectedStamps(data.stamps || []);
      })
      .catch((err) => {
        console.error('Failed to fetch stamps:', err);
        setCollectedStamps(loadLocal());
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, userId]);

  // ── Add stamp ──────────────────────────────────────────────────────────────
  const addStamp = useCallback((storeId: string) => {
    if (collectedStamps.includes(storeId)) return;

    const updated = [...collectedStamps, storeId];
    setCollectedStamps(updated);

    if (accessToken) {
      fetch(`${SERVER_URL}/stamps/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ storeId }),
      })
        .then((res) => {
          if (res.status === 401) { auth?.signOut?.(); return null; }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          if (data) setCollectedStamps(data.stamps || updated);
        })
        .catch((err) => {
          console.error('Add stamp error:', err);
        });
    } else {
      saveLocal(updated);
    }
  }, [collectedStamps, accessToken]);

  // ── Reset stamps ───────────────────────────────────────────────────────────
  const resetStamps = () => {
    setCollectedStamps([]);

    if (accessToken) {
      fetch(`${SERVER_URL}/stamps/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => {
          if (res.status === 401) auth?.signOut?.();
        })
        .catch((err) => {
          console.error('Reset stamps error:', err);
        });
    } else {
      saveLocal([]);
    }
  };

  const isCollected = (storeId: string) => collectedStamps.includes(storeId);

  return (
    <StampContext.Provider
      value={{
        collectedStamps,
        addStamp,
        resetStamps,
        isCollected,
        stampCount: collectedStamps.length,
        isLoading,
      }}
    >
      {children}
    </StampContext.Provider>
  );
}

export function useStamp() {
  const ctx = useContext(StampContext);
  if (!ctx) throw new Error('useStamp must be used within StampProvider');
  return ctx;
}