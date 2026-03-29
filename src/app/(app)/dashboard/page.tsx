'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, getMonthName, isOverdue, isDueToday, isDueSoon } from '@/lib/utils';
import {
  TrendingUp, TrendingDown, Wallet, AlertTriangle, ChevronLeft, ChevronRight,
  Loader2, Target, Building2, ArrowUpRight, ArrowDownRight, Clock, Pencil, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
import { Transaction } from '@/types/finance';
import TransactionModal from '@/components/modals/TransactionModal';

// ─── Saudação dinâmica ────────────────────────────────────────────────────────
function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function DashboardHeader() {
  const { user } = useSession();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  if (!now) return null;

  const greeting = getGreeting(now.getHours());
  const firstName = user?.name?.split(' ')[0] ?? '';
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const dateCap = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  return (
    <div className="bg-gradient-to-r from-[#1E3A5F] to-[#2E86AB] rounded-xl p-5 text-white shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold">{greeting}{firstName ? `, ${firstName}` : ''}! 👋</h2>
          <p className="text-blue-100 text-sm mt-0.5">{dateCap}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-mono font-semibold tracking-wider">{timeStr}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Card de resumo ───────────────────────────────────────────────────────────
function SummaryCard({ label, planned, realized, icon, colorClass, bgClass, isCount = false }: {
  label: string; planned?: number; realized: number; icon: React.ReactNode;
  colorClass: string; bgClass: string; isCount?: boolean;
}) {
  const diff = planned !== undefined ? realized - planned : undefined;
  const pct = planned && planned > 0 ? Math.min((realized / planned) * 100, 999) : null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <div className={`p-2 rounded-lg ${bgClass}`}>
          <span className={colorClass}>{icon}</span>
        </div>
      </div>
      <div>
        <p className={`text-2xl font-bold ${colorClass}`}>
          {isCount ? realized : formatCurrency(realized)}
        </p>
        {planned !== undefined && !isCount && (
          <div className="mt-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Previsto: {formatCurrency(planned)}</span>
              {pct !== null && <span className={diff! >= 0 ? 'text-green-600' : 'text-red-500'}>{pct.toFixed(0)}%</span>}
            </div>
            {pct !== null && (
              <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${pct > 100 ? 'bg-red-500' : pct > 80 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Painel de Investimentos ──────────────────────────────────────────────────
function InvestmentsPanel({ month, year }: { month: number; year: number }) {
  const { investments } = useFinance();

  const filtered = useMemo(() =>
    investments.filter(i => i.month === month && i.year === year),
    [investments, month, year]);

  const byType = useMemo(() => {
    const map: Record<string, { planned: number; actual: number }> = {};
    filtered.forEach(i => {
      if (!map[i.type]) map[i.type] = { planned: 0, actual: 0 };
      map[i.type].planned += i.plannedAmount;
      map[i.type].actual += i.actualAmount;
    });
    return map;
  }, [filtered]);

  const TYPE_LABELS: Record<string, string> = {
    emergency: 'Reserva de Emergência',
    long_term: 'Longo Prazo',
    future_projects: 'Projetos Futuros',
  };
  const TYPE_COLORS: Record<string, string> = {
    emergency: 'bg-blue-500',
    long_term: 'bg-purple-500',
    future_projects: 'bg-green-500',
  };

  const totalPlanned = filtered.reduce((s, i) => s + i.plannedAmount, 0);
  const totalActual = filtered.reduce((s, i) => s + i.actualAmount, 0);
  const totalPct = totalPlanned > 0 ? Math.min((totalActual / totalPlanned) * 100, 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Target size={18} className="text-purple-600" /> Investimentos — Meta vs Realizado
        </h3>
        <Link href="/investments" className="text-xs text-[#2E86AB] hover:underline">Ver todos</Link>
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">Nenhum investimento neste mês</p>
      ) : (
        <div className="space-y-4">
          {/* Total */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Total</span>
              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                {formatCurrency(totalActual)} / {formatCurrency(totalPlanned)}
              </span>
            </div>
            <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
              <div className="h-2 rounded-full bg-purple-600 transition-all" style={{ width: `${totalPct}%` }} />
            </div>
            <p className="text-xs text-purple-500 mt-1 text-right">{totalPct.toFixed(0)}% atingido</p>
          </div>

          {/* Por tipo */}
          {Object.entries(byType).map(([type, { planned, actual }]) => {
            const pct = planned > 0 ? Math.min((actual / planned) * 100, 100) : 0;
            return (
              <div key={type}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{TYPE_LABELS[type] ?? type}</span>
                  <span className="text-xs text-gray-500">{formatCurrency(actual)} / {formatCurrency(planned)}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full transition-all ${TYPE_COLORS[type] ?? 'bg-gray-400'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Painel de Patrimônio Líquido ─────────────────────────────────────────────
function PatrimonyPanel() {
  const { patrimonyItems } = useFinance();

  const assets = patrimonyItems.filter(p => p.itemType === 'asset');
  const liabilities = patrimonyItems.filter(p => p.itemType === 'liability');

  const totalAssets = assets.reduce((s, p) => s + p.purchaseValue + p.appreciation - p.depreciation, 0);
  const totalLiabilities = liabilities.reduce((s, p) => s + p.debtValue, 0);
  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 size={18} className="text-[#2E86AB]" /> Patrimônio Líquido
        </h3>
        <Link href="/patrimony" className="text-xs text-[#2E86AB] hover:underline">Detalhar</Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Ativos</p>
          <p className="font-bold text-green-600 text-sm">{formatCurrency(totalAssets)}</p>
        </div>
        <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Passivos</p>
          <p className="font-bold text-red-600 text-sm">{formatCurrency(totalLiabilities)}</p>
        </div>
        <div className={`text-center p-3 rounded-lg ${netWorth >= 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
          <p className="text-xs text-gray-500 mb-1">Líquido</p>
          <p className={`font-bold text-sm ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(netWorth)}</p>
        </div>
      </div>

      {patrimonyItems.length === 0 ? (
        <p className="text-gray-400 text-sm text-center">Nenhum item cadastrado</p>
      ) : (
        <div className="space-y-2">
          {assets.slice(0, 3).map(p => (
            <div key={p.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <ArrowUpRight size={14} className="text-green-500" /> {p.name}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(p.purchaseValue + p.appreciation - p.depreciation)}</span>
            </div>
          ))}
          {liabilities.slice(0, 2).map(p => (
            <div key={p.id} className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                <ArrowDownRight size={14} className="text-red-500" /> {p.name}
              </span>
              <span className="font-medium text-red-600">-{formatCurrency(p.debtValue)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Lançamentos recentes ─────────────────────────────────────────────────────
function RecentTransactions({ transactions }: { transactions: Transaction[] }) {
  const { deleteTransaction } = useFinance();
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const recent = useMemo(() =>
    [...transactions].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 8),
    [transactions]);

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta transação?')) return;
    setDeleting(id);
    try { await deleteTransaction(id); } finally { setDeleting(null); }
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Clock size={18} className="text-gray-500" /> Lançamentos Recentes
        </h3>
        <Link href="/transactions" className="text-xs text-[#2E86AB] hover:underline">Ver todos</Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">Nenhum lançamento neste mês</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {recent.map(t => (
            <div key={t.id} className="flex items-center gap-3 py-3">
              <div className={`w-2 h-2 rounded-full shrink-0 ${t.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                <p className="text-xs text-gray-500">{t.categoryName} · {new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : isOverdue(t.dueDate, t.status) ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
              </span>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => setEditing(t)}
                  className="p-1.5 text-gray-400 hover:text-[#1E3A5F] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleDelete(t.id)} disabled={deleting === t.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                  {deleting === t.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <TransactionModal transaction={editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const { transactions, investments, loading } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const filtered = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    }), [transactions, month, year]);

  // ── Receitas ──
  const incomeRealized = useMemo(() =>
    filtered.filter(t => t.type === 'income' && (t.status === 'received' || t.status === 'partial'))
      .reduce((s, t) => s + (t.paidAmount ?? t.amount), 0), [filtered]);
  const incomePlanned = useMemo(() =>
    filtered.filter(t => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0), [filtered]);

  // ── Despesas ──
  const expenseRealized = useMemo(() =>
    filtered.filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'partial'))
      .reduce((s, t) => s + (t.paidAmount ?? t.amount), 0), [filtered]);
  const expensePlanned = useMemo(() =>
    filtered.filter(t => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0), [filtered]);

  const balance = incomeRealized - expenseRealized;

  // ── Alertas ──
  const alerts = useMemo(() =>
    transactions.filter(t =>
      isOverdue(t.dueDate, t.status) || isDueToday(t.dueDate, t.status) || isDueSoon(t.dueDate, t.status)
    ).slice(0, 5), [transactions]);

  // ── Despesas por categoria (gráfico pizza) ──
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'partial'))
      .forEach(t => { map[t.categoryName] = (map[t.categoryName] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6);
  }, [filtered]);

  // ── Últimos 6 meses (gráfico barras) ──
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
      const incPlan = monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const incReal = monthTx.filter(t => t.type === 'income' && (t.status === 'received' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
      const expPlan = monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const expReal = monthTx.filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
      result.push({
        name: getMonthName(m).slice(0, 3),
        'Rec. Prevista': incPlan / 100,
        'Rec. Realizada': incReal / 100,
        'Desp. Prevista': expPlan / 100,
        'Desp. Realizada': expReal / 100,
      });
    }
    return result;
  }, [transactions, month, year]);

  const COLORS = ['#6366F1', '#0EA5E9', '#F97316', '#EF4444', '#8B5CF6', '#EC4899'];

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-[#1E3A5F]" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Saudação */}
      <DashboardHeader />

      {/* Seletor de mês */}
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

      {/* Cards: Previsto vs Realizado */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <SummaryCard
          label="Receitas Realizadas"
          planned={incomePlanned}
          realized={incomeRealized}
          icon={<TrendingUp size={20} />}
          colorClass="text-green-600"
          bgClass="bg-green-50 dark:bg-green-900/20"
        />
        <SummaryCard
          label="Despesas Realizadas"
          planned={expensePlanned}
          realized={expenseRealized}
          icon={<TrendingDown size={20} />}
          colorClass="text-red-600"
          bgClass="bg-red-50 dark:bg-red-900/20"
        />
        <SummaryCard
          label="Saldo do Mês"
          realized={balance}
          icon={<Wallet size={20} />}
          colorClass={balance >= 0 ? 'text-blue-600' : 'text-red-600'}
          bgClass="bg-blue-50 dark:bg-blue-900/20"
        />
        <SummaryCard
          label="Alertas Pendentes"
          realized={alerts.length}
          icon={<AlertTriangle size={20} />}
          colorClass="text-yellow-600"
          bgClass="bg-yellow-50 dark:bg-yellow-900/20"
          isCount
        />
      </div>

      {/* Gráfico de barras: Previsto vs Realizado */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Previsto vs Realizado — Últimos 6 meses
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={barData} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
            <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="Rec. Prevista"   fill="#86EFAC" radius={[3,3,0,0]} />
            <Bar dataKey="Rec. Realizada"  fill="#10B981" radius={[3,3,0,0]} />
            <Bar dataKey="Desp. Prevista"  fill="#FCA5A5" radius={[3,3,0,0]} />
            <Bar dataKey="Desp. Realizada" fill="#EF4444" radius={[3,3,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Investimentos + Patrimônio */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <InvestmentsPanel month={month} year={year} />
        <PatrimonyPanel />
      </div>

      {/* Gráfico pizza + Alertas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pizza */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Despesas por categoria</h3>
          {expenseByCategory.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-gray-400 text-sm">
              Nenhuma despesa realizada neste mês
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {expenseByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Alertas */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle size={18} className="text-yellow-500" /> Alertas e Pendências
            </h3>
            <Link href="/alerts" className="text-xs text-[#2E86AB] hover:underline">Ver todos</Link>
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
                    <AlertTriangle size={15} className={`mt-0.5 shrink-0 ${overdue ? 'text-red-600' : today ? 'text-yellow-600' : 'text-blue-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{t.description}</p>
                      <p className="text-xs text-gray-500">
                        {overdue ? 'Vencida' : today ? 'Vence hoje' : 'Vence em breve'} · {formatCurrency(t.amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lançamentos recentes com edição */}
      <RecentTransactions transactions={filtered} />
    </div>
  );
}
