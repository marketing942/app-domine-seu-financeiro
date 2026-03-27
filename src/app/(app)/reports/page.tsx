'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#6366F1','#0EA5E9','#F97316','#EF4444','#8B5CF6','#EC4899','#10B981','#F59E0B'];

export default function ReportsPage() {
  const { transactions, loading } = useFinance();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());

  const yearData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const monthTx = transactions.filter(t => {
        const d = new Date(t.dueDate + 'T00:00:00');
        return d.getMonth() + 1 === m && d.getFullYear() === year;
      });
      const income = monthTx.filter(t => t.type === 'income' && (t.status === 'received' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
      const expense = monthTx.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      return { name: getMonthName(m).slice(0, 3), receitas: income / 100, despesas: expense / 100, saldo: (income - expense) / 100 };
    });
  }, [transactions, year]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      return d.getFullYear() === year && t.type === 'expense' && t.status === 'paid';
    }).forEach(t => { map[t.categoryName] = (map[t.categoryName] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value: value / 100 })).sort((a, b) => b.value - a.value).slice(0, 8);
  }, [transactions, year]);

  const totalIncome = yearData.reduce((s, d) => s + d.receitas, 0);
  const totalExpense = yearData.reduce((s, d) => s + d.despesas, 0);
  const totalBalance = totalIncome - totalExpense;

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
        <span className="font-semibold text-gray-900 dark:text-white text-lg">{year}</span>
        <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
      </div>

      {/* Annual summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Receitas no ano</p>
          <p className="font-bold text-green-600">{formatCurrency(totalIncome * 100)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Despesas no ano</p>
          <p className="font-bold text-red-600">{formatCurrency(totalExpense * 100)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Saldo no ano</p>
          <p className={`font-bold ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(totalBalance * 100)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Receitas vs Despesas mensais</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={yearData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
            <Tooltip formatter={(v: any) => formatCurrency(v * 100)} />
            <Bar dataKey="receitas" name="Receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Line chart (balance) */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Evolução do saldo mensal</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={yearData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
            <Tooltip formatter={(v: any) => formatCurrency(v * 100)} />
            <Line type="monotone" dataKey="saldo" name="Saldo" stroke="#6366F1" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pie chart */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Despesas por categoria (ano)</h3>
        {categoryData.length === 0 ? (
          <p className="text-center text-gray-400 py-8">Nenhuma despesa paga neste ano</p>
        ) : (
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name">
                  {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v * 100)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 min-w-[200px]">
              {categoryData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{d.name}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(d.value * 100)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
