'use client';

import { useState, createContext, useContext } from 'react';
import { FinanceProvider } from '@/lib/finance-context';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import TransactionModal from '@/components/modals/TransactionModal';
import { Instagram, Share2 } from 'lucide-react';

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

function AppFooter() {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dominiodofinanceiro.vercel.app';
  const whatsappText = encodeURIComponent(
    `💰 Estou usando o *Domínio Financeiro* para organizar minhas finanças!\n\nÉ gratuito e muito fácil de usar. Acesse agora: ${appUrl}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
      {/* Crédito do idealizador */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <span>Idealizador do App:</span>
        <a
          href="https://www.instagram.com/prof.evertonmota"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 font-medium transition-colors"
        >
          <Instagram size={13} />
          @prof.evertonmota
        </a>
      </div>

      {/* Botão compartilhar no WhatsApp */}
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full font-medium transition-colors shadow-sm"
      >
        <Share2 size={12} />
        Compartilhar no WhatsApp
      </a>
    </footer>
  );
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
            <AppFooter />
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
