'use client';

import { useEffect } from 'react';

/**
 * Aplica o tema salvo no localStorage imediatamente ao montar,
 * evitando o flash de tema errado no carregamento.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const saved = localStorage.getItem('df-theme');
    const theme = saved ?? 'system';
    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return <>{children}</>;
}
