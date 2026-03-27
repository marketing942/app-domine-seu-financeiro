'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, getMonthName, isOverdue, isDueToday, isDueSoon } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, AlertTriangle, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Link from 'next/link';

export default function DashboardPage() {
  const { transactions, categories, loading } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const filtered = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    }), [transactions, month, year]);

  const realized = filtered.filter(t => t.status === 'paid' || t.status === 'received' || t.status === 'partial');
  const totalIncome = realized.filter(t => t.type === 'income').reduce((s, t) => s + (t.paidAmount ?? t.amount), 0);
  const totalExpense = realized.filter(t => t.type === 'expense').reduce((s, t) => s + (t.paidAmount ?? t.amount), 0);
  const balance = totalIncome - totalExpense;

  const pendingExpenses = filtered.filter(t => t.type === 'expense' && (t.status === 'pending' || t.status === 'partial'));
  const pendingIncome = filtered.filter(t => t.type === 'income' && (t.status === 'pending' || t.status === 'to_receive' || t.status === 'partial'));

  const alerts = transactions.filter(t =>
    isOverdue(t.dueDate, t.status) || isDueToday(t.dueDate, t.status) || isDueSoon(t.dueDate, t.status)
  ).slice(0, 5);

  // Expense by category
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense' && t.status === 'paid').forEach(t => {
      map[t.categoryName] = (map[t.categoryName] || 0) + t.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

  // Last 6 months bar chart
  const barData = useMemo(() => {
    const result = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const monthTx = transactions.filter(t => {
        const td = new Date(t.dueDate + 'T00:00:00');
        return td.getMonth() + 1 === m && td.getFullYear() === y;
      });
      const inc = monthTx.filter(t => t.type === 'income' && (t.status === 'received' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
      const exp = monthTx.filter(t => t.type === 'expense' && t.status === 'paid').reduce((s, t) => s + t.amount, 0);
      result.push({ name: getMonthName(m).slice(0, 3), receitas: inc / 100, despesas: exp / 100 });
    }
    return result;
  }, [transactions, month, year]);

  const COLORS = ['#6366F1', '#0EA5E9', '#F97316', '#EF4444', '#8B5CF6', '#EC4899'];

  function prevMonth() {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-primary-600" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
          <ChevronLeft size={20} />
        </button>
        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">
          {getMonthName(month)} {year}
        </span>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard label="Receitas realizadas" value={totalIncome} icon={<TrendingUp size={20} />} color="text-green-600" bg="bg-green-50 dark:bg-green-900/20" />
        <SummaryCard label="Despesas realizadas" value={totalExpense} icon={<TrendingDown size={20} />} color="text-red-600" bg="bg-red-50 dark:bg-red-900/20" />
        <SummaryCard label="Saldo do mês" value={balance} icon={<Wallet size={20} />} color={balance >= 0 ? 'text-blue-600' : 'text-red-600'} bg="bg-blue-50 dark:bg-blue-900/20" />
        <SummaryCard label="Alertas pendentes" value={alerts.length} icon={<AlertTriangle size={20} />} color="text-yellow-600" bg="bg-yellow-50 dark:bg-yellow-900/20" isCount />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Receitas vs Despesas (6 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: any) => formatCurrency(v * 100)} />
              <Bar dataKey="receitas" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Despesas por categoria</h3>
          {expenseByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">Nenhuma despesa paga neste mês</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={11}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Pending & Alerts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pending expenses */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Despesas pendentes</h3>
            <Link href="/transactions" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Ver todas</Link>
          </div>
          {pendingExpenses.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhuma despesa pendente 🎉</p>
          ) : (
            <div className="space-y-2">
              {pendingExpenses.slice(0, 5).map(t => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{t.description}</p>
                    <p className="text-xs text-gray-500">{t.categoryName} · {new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <span className={`text-sm font-semibold ${isOverdue(t.dueDate, t.status) ? 'text-red-600' : 'text-gray-700 dark:text-gray-300'}`}>
                    {formatCurrency(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Alertas</h3>
            <Link href="/alerts" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Ver todos</Link>
          </div>
          {alerts.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Nenhum alerta no momento ✅</p>
          ) : (
            <div className="space-y-2">
              {alerts.map(t => {
                const overdue = isOverdue(t.dueDate, t.status);
                const today = isDueToday(t.dueDate, t.status);
                return (
                  <div key={t.id} className={`flex items-start gap-3 p-3 rounded-lg ${overdue ? 'bg-red-50 dark:bg-red-900/20' : today ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                    <AlertTriangle size={16} className={overdue ? 'text-red-600 mt-0.5' : today ? 'text-yellow-600 mt-0.5' : 'text-blue-600 mt-0.5'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-gray-500">{overdue ? 'Vencida' : today ? 'Vence hoje' : 'Vence em breve'} · {formatCurrency(t.amount)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, icon, color, bg, isCount }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`p-2 rounded-lg ${bg}`}>
          <span className={color}>{icon}</span>
        </div>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {isCount ? value : formatCurrency(value)}
      </p>
    </div>
  );
}
