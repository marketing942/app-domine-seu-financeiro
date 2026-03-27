'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, formatDate, getMonthName, isOverdue } from '@/lib/utils';
import { Plus, Search, ChevronLeft, ChevronRight, Pencil, Trash2, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types/finance';
import TransactionModal from '@/components/modals/TransactionModal';
import { cn } from '@/lib/utils';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pago', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  received: { label: 'Recebido', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partial: { label: 'Parcial', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Pendente', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  to_receive: { label: 'A receber', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  no_demand: { label: 'Sem cobrança', color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

export default function TransactionsPage() {
  const { transactions, loading, deleteTransaction } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      const matchMonth = d.getMonth() + 1 === month && d.getFullYear() === year;
      const matchType = typeFilter === 'all' || t.type === typeFilter;
      const matchSearch = !search || t.description.toLowerCase().includes(search.toLowerCase()) || t.categoryName.toLowerCase().includes(search.toLowerCase());
      return matchMonth && matchType && matchSearch;
    }).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [transactions, month, year, search, typeFilter]);

  const totalIncome = filtered.filter(t => t.type === 'income' && (t.status === 'received' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return;
    setDeleting(id);
    try { await deleteTransaction(id); } finally { setDeleting(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-900 dark:text-white min-w-[150px] text-center">{getMonthName(month)} {year}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
        </div>
        <button onClick={() => { setEditing(null); setModalOpen(true); }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} /> Nova transação
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><TrendingUp size={18} className="text-green-600" /></div>
          <div><p className="text-xs text-gray-500">Receitas</p><p className="font-bold text-green-600">{formatCurrency(totalIncome)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><TrendingDown size={18} className="text-red-600" /></div>
          <div><p className="text-xs text-gray-500">Despesas</p><p className="font-bold text-red-600">{formatCurrency(totalExpense)}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar transações..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)}
              className={cn('px-3 py-2 text-sm rounded-lg font-medium transition',
                typeFilter === f ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700')}>
              {f === 'all' ? 'Todos' : f === 'income' ? 'Receitas' : 'Despesas'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Nenhuma transação encontrada</p>
            <p className="text-sm">Clique em "Nova transação" para adicionar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(t => {
              const overdue = isOverdue(t.dueDate, t.status);
              const statusInfo = STATUS_LABELS[t.status] || { label: t.status, color: 'bg-gray-100 text-gray-600' };
              return (
                <div key={t.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.categoryName} · {formatDate(t.dueDate)}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                  <span className={`font-semibold text-sm ${t.type === 'income' ? 'text-green-600' : overdue ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(t); setModalOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      {deleting === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <TransactionModal
          transaction={editing}
          onClose={() => { setModalOpen(false); setEditing(null); }}
        />
      )}
    </div>
  );
}
