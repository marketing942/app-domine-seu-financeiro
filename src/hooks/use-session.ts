'use client';

import { useState, useEffect, useCallback } from 'react';

interface SessionUser {
  id: number;
  name: string;
  email: string;
  avatarUrl: string | null;
}

interface UseSessionResult {
  user: SessionUser | null;
  loading: boolean;
  updateAvatar: (avatarUrl: string | null) => Promise<void>;
  refreshUser: () => Promise<void>;
}

let cachedUser: SessionUser | null = null;
let cacheLoaded = false;
const listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach(fn => fn());
}

async function fetchMe(): Promise<SessionUser | null> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'me' }),
    });
    const data = await res.json();
    return data.user ?? null;
  } catch {
    return null;
  }
}

export function useSession(): UseSessionResult {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const fn = () => forceUpdate(n => n + 1);
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx !== -1) listeners.splice(idx, 1);
    };
  }, []);

  useEffect(() => {
    if (cacheLoaded) return;
    fetchMe().then(user => {
      cachedUser = user;
      cacheLoaded = true;
      notifyListeners();
    });
  }, []);

  const updateAvatar = useCallback(async (avatarUrl: string | null) => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update-avatar', avatarUrl }),
    });
    if (cachedUser) {
      cachedUser = { ...cachedUser, avatarUrl };
      notifyListeners();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    const user = await fetchMe();
    cachedUser = user;
    cacheLoaded = true;
    notifyListeners();
  }, []);

  return {
    user: cachedUser,
    loading: !cacheLoaded,
    updateAvatar,
    refreshUser,
  };
}
