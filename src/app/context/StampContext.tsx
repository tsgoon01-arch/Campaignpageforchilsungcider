import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { AuthContext } from './AuthContext';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-66d4cc36`;
const LOCAL_KEY = 'chilsung-stamps';

export interface EntryRecord {
  entryId: string;
  entryType: 'tshirt77' | 'korail';
  title: string;
  emoji: string;
  description: string;
  registeredAt: string;
}

export interface Entries {
  tshirt77: EntryRecord | null;
  korail: EntryRecord | null;
}

interface StampContextType {
  collectedStamps: string[];
  addStamp: (storeId: string) => void;
  resetStamps: () => void;
  isCollected: (storeId: string) => boolean;
  stampCount: number;
  isLoading: boolean;
  entries: Entries;
  newEntryAlert: string | null;
  clearNewEntryAlert: () => void;
}

const StampContext = createContext<StampContextType | null>(null);

// ── LocalStorage helpers (guest mode) ─────────────────────────────────────────
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
  const [entries, setEntries] = useState<Entries>({ tshirt77: null, korail: null });
  const [newEntryAlert, setNewEntryAlert] = useState<string | null>(null);

  // ── Fetch stamps + entries from server ────────────────────────────────────
  useEffect(() => {
    if (!accessToken || !userId) {
      setCollectedStamps(loadLocal());
      setEntries({ tshirt77: null, korail: null });
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
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCollectedStamps(data.stamps || []);
        if (data.entries) setEntries(data.entries);
      })
      .catch((err) => {
        console.error('Failed to fetch stamps:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, userId]);

  // ── Add stamp ─────────────────────────────────────────────────────────────
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
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((data) => {
          setCollectedStamps(data.stamps || updated);
          if (data.entries) setEntries(data.entries);
          if (data.newEntry) {
            setNewEntryAlert(data.newEntry);
          }
        })
        .catch((err) => {
          console.error('Add stamp error:', err);
        });
    } else {
      saveLocal(updated);
    }
  }, [collectedStamps, accessToken]);

  // ── Reset stamps ──────────────────────────────────────────────────────────
  const resetStamps = () => {
    setCollectedStamps([]);
    setEntries({ tshirt77: null, korail: null });

    if (accessToken) {
      fetch(`${SERVER_URL}/stamps/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.entries) setEntries(data.entries);
        })
        .catch((err) => {
          console.error('Reset stamps error:', err);
        });
    } else {
      saveLocal([]);
    }
  };

  const isCollected = (storeId: string) => collectedStamps.includes(storeId);
  const clearNewEntryAlert = () => setNewEntryAlert(null);

  return (
    <StampContext.Provider
      value={{
        collectedStamps,
        addStamp,
        resetStamps,
        isCollected,
        stampCount: collectedStamps.length,
        isLoading,
        entries,
        newEntryAlert,
        clearNewEntryAlert,
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
