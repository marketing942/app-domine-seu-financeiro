'use client';

import { useState, useEffect } from 'react';

interface SessionUser {
  id: number;
  name: string;
  email: string;
}

interface UseSessionResult {
  user: SessionUser | null;
  loading: boolean;
}

let cachedUser: SessionUser | null = null;
let cacheLoaded = false;

export function useSession(): UseSessionResult {
  const [user, setUser] = useState<SessionUser | null>(cachedUser);
  const [loading, setLoading] = useState(!cacheLoaded);

  useEffect(() => {
    if (cacheLoaded) {
      setUser(cachedUser);
      setLoading(false);
      return;
    }
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'me' }),
    })
      .then(r => r.json())
      .then(data => {
        cachedUser = data.user ?? null;
        cacheLoaded = true;
        setUser(cachedUser);
      })
      .catch(() => {
        cacheLoaded = true;
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return { user, loading };
}
