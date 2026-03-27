'use client';

import { FinanceProvider } from '@/lib/finance-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface User {
  id: number;
  name: string;
  email: string;
}

export default function AppShell({ children, user }: { children: React.ReactNode; user: User }) {
  return (
    <FinanceProvider>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
        <Sidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar user={user} />
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </FinanceProvider>
  );
}
