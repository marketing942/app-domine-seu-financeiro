'use client';

import { usePathname } from 'next/navigation';
import { Bell, Plus } from 'lucide-react';
import Link from 'next/link';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/transactions': 'Transações',
  '/categories': 'Categorias',
  '/budget': 'Orçamento',
  '/investments': 'Investimentos',
  '/patrimony': 'Patrimônio',
  '/reports': 'Relatórios',
  '/alerts': 'Alertas',
  '/settings': 'Configurações',
};

interface TopBarProps {
  user: { name: string };
}

export default function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] || 'Domínio Financeiro';

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 flex items-center justify-between shrink-0">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-3">
        <Link href="/transactions/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} />
          Nova transação
        </Link>
        <Link href="/alerts" className="relative p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <Bell size={20} />
        </Link>
      </div>
    </header>
  );
}
