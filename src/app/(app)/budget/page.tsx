'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, getMonthName, maskCurrency, parseCurrency } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';

export default function BudgetPage() {
  const { transactions, categories, monthlyBudgets, upsertBudget, loading } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [saving, setSaving] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const monthTransactions = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      return d.getMonth() + 1 === month && d.getFullYear() === year && t.type === 'expense';
    }), [transactions, month, year]);

  const budgetMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthlyBudgets.filter(b => b.month === month && b.year === year).forEach(b => { map[b.categoryId] = b.plannedAmount; });
    return map;
  }, [monthlyBudgets, month, year]);

  const spentMap = useMemo(() => {
    const map: Record<string, number> = {};
    monthTransactions.filter(t => t.status === 'paid').forEach(t => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });
    return map;
  }, [monthTransactions]);

  const totalBudget = Object.values(budgetMap).reduce((s, v) => s + v, 0);
  const totalSpent = Object.values(spentMap).reduce((s, v) => s + v, 0);

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  async function handleSave(categoryId: string) {
    const raw = editValues[categoryId] ?? '';
    const amount = parseCurrency(raw);
    setSaving(categoryId);
    try {
      await upsertBudget({ categoryId, month, year, plannedAmount: amount });
      setEditValues(prev => { const n = { ...prev }; delete n[categoryId]; return n; });
    } finally { setSaving(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
        <span className="font-semibold text-gray-900 dark:text-white min-w-[150px] text-center">{getMonthName(month)} {year}</span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Orçado</p>
          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalBudget)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Gasto</p>
          <p className={`font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{formatCurrency(totalSpent)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Disponível</p>
          <p className={`font-bold ${totalBudget - totalSpent < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(totalBudget - totalSpent)}</p>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Orçamento por categoria</h3>
          <p className="text-xs text-gray-500 mt-0.5">Defina o limite de gastos para cada categoria</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {expenseCategories.map(cat => {
            const budget = budgetMap[cat.id] || 0;
            const spent = spentMap[cat.id] || 0;
            const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
            const over = budget > 0 && spent > budget;
            const editVal = editValues[cat.id];
            const displayVal = editVal !== undefined ? editVal : (budget > 0 ? (budget / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');

            return (
              <div key={cat.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{formatCurrency(spent)}</span>
                    <span className="text-xs text-gray-400">/</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-400">R$</span>
                      <input
                        value={displayVal}
                        onChange={e => setEditValues(prev => ({ ...prev, [cat.id]: maskCurrency(e.target.value) }))}
                        placeholder="0,00"
                        className="w-24 text-xs text-right px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                      {editVal !== undefined && (
                        <button onClick={() => handleSave(cat.id)} disabled={saving === cat.id}
                          className="p-1 bg-primary-600 hover:bg-primary-700 text-white rounded transition">
                          {saving === cat.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {budget > 0 && (
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
