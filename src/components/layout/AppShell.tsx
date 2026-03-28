'use client';

import { useState, createContext, useContext } from 'react';
import { FinanceProvider } from '@/lib/finance-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TransactionModal from '@/components/modals/TransactionModal';

interface User {
  id: number;
  name: string;
  email: string;
}

// Context para controlar o modal de transação globalmente
interface AppUIContextType {
  openNewTransaction: () => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

const AppUIContext = createContext<AppUIContextType>({
  openNewTransaction: () => {},
  sidebarOpen: true,
  toggleSidebar: () => {},
});

export function useAppUI() {
  return useContext(AppUIContext);
}

export default function AppShell({ children, user }: { children: React.ReactNode; user: User }) {
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  function openNewTransaction() {
    setTransactionModalOpen(true);
  }

  function toggleSidebar() {
    setSidebarOpen(prev => !prev);
  }

  return (
    <FinanceProvider>
      <AppUIContext.Provider value={{ openNewTransaction, sidebarOpen, toggleSidebar }}>
        <div className="flex h-screen bg-gray-50 dark:bg-gray-950 overflow-hidden">
          {/* Overlay para mobile quando sidebar está aberta */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/40 z-20 md:hidden"
              onClick={toggleSidebar}
            />
          )}

          {/* Sidebar */}
          <div className={`
            fixed md:relative z-30 md:z-auto h-full transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'}
          `}>
            <Sidebar user={user} />
          </div>

          {/* Conteúdo principal */}
          <div className={`flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ${sidebarOpen ? 'md:ml-0' : 'ml-0'}`}>
            <TopBar user={user} />
            <main className="flex-1 overflow-y-auto p-4 md:p-6">
              {children}
            </main>
          </div>
        </div>

        {/* Modal global de nova transação */}
        {transactionModalOpen && (
          <TransactionModal
            onClose={() => setTransactionModalOpen(false)}
          />
        )}
      </AppUIContext.Provider>
    </FinanceProvider>
  );
}
