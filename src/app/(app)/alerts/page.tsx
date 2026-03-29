'use client';

import { useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, formatDate, isOverdue, isDueToday, isDueSoon } from '@/lib/utils';
import { AlertTriangle, Clock, Calendar, Loader2 } from 'lucide-react';

export default function AlertsPage() {
  const { transactions, loading } = useFinance();

  const { overdue, today, soon } = useMemo(() => {
    const overdue = transactions.filter(t => isOverdue(t.dueDate, t.status));
    const today = transactions.filter(t => isDueToday(t.dueDate, t.status));
    const soon = transactions.filter(t => isDueSoon(t.dueDate, t.status) && !isDueToday(t.dueDate, t.status));
    return { overdue, today, soon };
  }, [transactions]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-[#1E3A5F]" /></div>;

  const totalAlerts = overdue.length + today.length + soon.length;

  return (
    <div className="space-y-6">
      {totalAlerts === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Tudo em dia!</h2>
          <p className="text-gray-500">Nenhum alerta pendente no momento.</p>
        </div>
      ) : (
        <>
          {overdue.length > 0 && (
            <AlertSection
              title="Vencidas"
              icon={<AlertTriangle size={18} className="text-red-600" />}
              color="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10"
              headerColor="text-red-700 dark:text-red-400"
              items={overdue}
              badge="bg-red-600"
            />
          )}
          {today.length > 0 && (
            <AlertSection
              title="Vencem hoje"
              icon={<Clock size={18} className="text-yellow-600" />}
              color="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/10"
              headerColor="text-yellow-700 dark:text-yellow-400"
              items={today}
              badge="bg-yellow-500"
            />
          )}
          {soon.length > 0 && (
            <AlertSection
              title="Vencem em breve (próximos 7 dias)"
              icon={<Calendar size={18} className="text-blue-600" />}
              color="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10"
              headerColor="text-blue-700 dark:text-blue-400"
              items={soon}
              badge="bg-blue-500"
            />
          )}
        </>
      )}
    </div>
  );
}

function AlertSection({ title, icon, color, headerColor, items, badge }: any) {
  return (
    <div className={`rounded-xl border ${color} overflow-hidden`}>
      <div className={`px-5 py-3 flex items-center gap-2 ${headerColor} font-semibold`}>
        {icon}
        {title}
        <span className={`ml-auto text-white text-xs px-2 py-0.5 rounded-full ${badge}`}>{items.length}</span>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {items.map((t: any) => (
          <div key={t.id} className="flex items-center justify-between px-5 py-3 bg-white dark:bg-gray-900">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">{t.description}</p>
              <p className="text-xs text-gray-500">{t.categoryName} · Vence: {formatDate(t.dueDate)}</p>
            </div>
            <div className="text-right">
              <p className={`font-semibold text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
              </p>
              <p className="text-xs text-gray-500">{t.type === 'expense' ? 'Despesa' : 'Receita'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
