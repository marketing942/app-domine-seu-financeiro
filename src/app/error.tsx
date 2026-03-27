'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-300 dark:text-gray-700 mb-4">500</h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Algo deu errado</h2>
        <p className="text-gray-500 mb-8">Ocorreu um erro inesperado.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={reset} className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition">
            Tentar novamente
          </button>
          <Link href="/dashboard" className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            Ir ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
