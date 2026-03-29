'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { formatCurrency, getMonthName } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Loader2, TrendingUp, TrendingDown, Wallet, Target, Building2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#6366F1','#0EA5E9','#F97316','#EF4444','#8B5CF6','#EC4899','#10B981','#F59E0B','#14B8A6','#F43F5E'];

type ReportTab = 'annual' | 'monthly' | 'investments' | 'patrimony' | 'categories';

const TABS: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'annual',      label: 'Anual',          icon: <TrendingUp size={15} /> },
  { id: 'monthly',     label: 'Mensal Detalhado',icon: <Wallet size={15} /> },
  { id: 'investments', label: 'Investimentos',   icon: <Target size={15} /> },
  { id: 'patrimony',   label: 'Patrimônio',      icon: <Building2 size={15} /> },
  { id: 'categories',  label: 'Por Categoria',   icon: <TrendingDown size={15} /> },
];

export default function ReportsPage() {
  const { transactions, investments, patrimonyItems, loading } = useFinance();
  const now = new Date();
  const [activeTab, setActiveTab] = useState<ReportTab>('annual');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  // ── Dados anuais ──────────────────────────────────────────────────────────
  const yearData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const tx = transactions.filter(t => {
        const d = new Date(t.dueDate + 'T00:00:00');
        return d.getMonth() + 1 === m && d.getFullYear() === year;
      });
      const incPlan = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const incReal = tx.filter(t => t.type === 'income' && (t.status === 'received' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
      const expPlan = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const expReal = tx.filter(t => t.type === 'expense' && (t.status === 'paid' || t.status === 'partial')).reduce((s, t) => s + t.amount, 0);
      return {
        name: getMonthName(m).slice(0, 3),
        'Rec. Prevista': incPlan / 100,
        'Rec. Realizada': incReal / 100,
        'Desp. Prevista': expPlan / 100,
        'Desp. Realizada': expReal / 100,
        saldo: (incReal - expReal) / 100,
      };
    }), [transactions, year]);

  const annualTotals = useMemo(() => ({
    incPlan: yearData.reduce((s, d) => s + d['Rec. Prevista'], 0),
    incReal: yearData.reduce((s, d) => s + d['Rec. Realizada'], 0),
    expPlan: yearData.reduce((s, d) => s + d['Desp. Prevista'], 0),
    expReal: yearData.reduce((s, d) => s + d['Desp. Realizada'], 0),
    balance: yearData.reduce((s, d) => s + d.saldo, 0),
  }), [yearData]);

  // ── Dados mensais detalhados ──────────────────────────────────────────────
  const monthlyTx = useMemo(() =>
    transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    }), [transactions, month, year]);

  const monthlyIncome = monthlyTx.filter(t => t.type === 'income');
  const monthlyExpense = monthlyTx.filter(t => t.type === 'expense');
  const incRealMonth = monthlyIncome.filter(t => t.status === 'received' || t.status === 'partial').reduce((s, t) => s + t.amount, 0);
  const incPlanMonth = monthlyIncome.reduce((s, t) => s + t.amount, 0);
  const expRealMonth = monthlyExpense.filter(t => t.status === 'paid' || t.status === 'partial').reduce((s, t) => s + t.amount, 0);
  const expPlanMonth = monthlyExpense.reduce((s, t) => s + t.amount, 0);

  const monthlyByCategory = useMemo(() => {
    const map: Record<string, { planned: number; realized: number }> = {};
    monthlyExpense.forEach(t => {
      if (!map[t.categoryName]) map[t.categoryName] = { planned: 0, realized: 0 };
      map[t.categoryName].planned += t.amount;
      if (t.status === 'paid' || t.status === 'partial') map[t.categoryName].realized += t.amount;
    });
    return Object.entries(map).map(([name, v]) => ({ name, Previsto: v.planned / 100, Realizado: v.realized / 100 }))
      .sort((a, b) => b.Previsto - a.Previsto);
  }, [monthlyExpense]);

  // ── Dados de investimentos ────────────────────────────────────────────────
  const investmentYearData = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const inv = investments.filter(i => i.month === m && i.year === year);
      const planned = inv.reduce((s, i) => s + i.plannedAmount, 0);
      const actual = inv.reduce((s, i) => s + i.actualAmount, 0);
      return { name: getMonthName(m).slice(0, 3), Planejado: planned / 100, Realizado: actual / 100 };
    }), [investments, year]);

  const invTotals = useMemo(() => ({
    planned: investmentYearData.reduce((s, d) => s + d.Planejado, 0),
    actual: investmentYearData.reduce((s, d) => s + d.Realizado, 0),
  }), [investmentYearData]);

  const invByType = useMemo(() => {
    const map: Record<string, { planned: number; actual: number }> = {};
    investments.filter(i => i.year === year).forEach(i => {
      if (!map[i.type]) map[i.type] = { planned: 0, actual: 0 };
      map[i.type].planned += i.plannedAmount;
      map[i.type].actual += i.actualAmount;
    });
    const labels: Record<string, string> = { emergency: 'Reserva de Emergência', long_term: 'Longo Prazo', future_projects: 'Projetos Futuros' };
    return Object.entries(map).map(([type, v]) => ({ name: labels[type] ?? type, Planejado: v.planned / 100, Realizado: v.actual / 100 }));
  }, [investments, year]);

  // ── Dados de patrimônio ───────────────────────────────────────────────────
  const assets = patrimonyItems.filter(p => p.itemType === 'asset');
  const liabilities = patrimonyItems.filter(p => p.itemType === 'liability');
  const totalAssets = assets.reduce((s, p) => s + p.purchaseValue + p.appreciation - p.depreciation, 0);
  const totalLiabilities = liabilities.reduce((s, p) => s + p.debtValue, 0);
  const netWorth = totalAssets - totalLiabilities;

  const assetByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    assets.forEach(p => { map[p.category] = (map[p.category] || 0) + p.purchaseValue + p.appreciation - p.depreciation; });
    const labels: Record<string, string> = { real_estate: 'Imóveis', vehicle: 'Veículos', investment: 'Investimentos', equipment: 'Equipamentos', other: 'Outros' };
    return Object.entries(map).map(([cat, v]) => ({ name: labels[cat] ?? cat, value: v / 100 })).sort((a, b) => b.value - a.value);
  }, [assets]);

  // ── Dados por categoria (anual) ───────────────────────────────────────────
  const categoryAnnual = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter(t => {
      const d = new Date(t.dueDate + 'T00:00:00');
      return d.getFullYear() === year && t.type === 'expense' && (t.status === 'paid' || t.status === 'partial');
    }).forEach(t => { map[t.categoryName] = (map[t.categoryName] || 0) + t.amount; });
    return Object.entries(map).map(([name, value]) => ({ name, value: value / 100 })).sort((a, b) => b.value - a.value);
  }, [transactions, year]);

  const totalCategoryAnnual = categoryAnnual.reduce((s, d) => s + d.value, 0);

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-[#1E3A5F]" /></div>;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-[#1E3A5F] text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── Relatório Anual ── */}
      {activeTab === 'annual' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-gray-900 dark:text-white text-lg min-w-[60px] text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Rec. Prevista', value: annualTotals.incPlan * 100, color: 'text-green-400' },
              { label: 'Rec. Realizada', value: annualTotals.incReal * 100, color: 'text-green-600' },
              { label: 'Desp. Prevista', value: annualTotals.expPlan * 100, color: 'text-red-400' },
              { label: 'Desp. Realizada', value: annualTotals.expReal * 100, color: 'text-red-600' },
              { label: 'Saldo Realizado', value: annualTotals.balance * 100, color: annualTotals.balance >= 0 ? 'text-blue-600' : 'text-red-600' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`font-bold text-sm ${c.color}`}>{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Previsto vs Realizado — Mensal</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yearData} barCategoryGap="15%">
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

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Evolução do Saldo Mensal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={yearData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
                <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#1E3A5F" fill="#C2D2E8" strokeWidth={2} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Relatório Mensal Detalhado ── */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-gray-900 dark:text-white min-w-[160px] text-center">{getMonthName(month)} {year}</span>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Rec. Prevista', value: incPlanMonth, color: 'text-green-400' },
              { label: 'Rec. Realizada', value: incRealMonth, color: 'text-green-600' },
              { label: 'Desp. Prevista', value: expPlanMonth, color: 'text-red-400' },
              { label: 'Desp. Realizada', value: expRealMonth, color: 'text-red-600' },
            ].map(c => (
              <div key={c.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
                <p className="text-xs text-gray-500 mb-1">{c.label}</p>
                <p className={`font-bold ${c.color}`}>{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>

          {/* Despesas por categoria — previsto vs realizado */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Despesas por Categoria — Previsto vs Realizado</h3>
            {monthlyByCategory.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhuma despesa neste mês</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(200, monthlyByCategory.length * 50)}>
                <BarChart data={monthlyByCategory} layout="vertical" barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Previsto"  fill="#FCA5A5" radius={[0,3,3,0]} />
                  <Bar dataKey="Realizado" fill="#EF4444" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Tabela detalhada de lançamentos */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Lançamentos do mês</h3>
            </div>
            {monthlyTx.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">Nenhum lançamento neste mês</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Descrição</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoria</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Vencimento</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {monthlyTx.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{t.description}</td>
                        <td className="px-4 py-3 text-gray-500">{t.categoryName}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(t.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            t.status === 'paid' || t.status === 'received' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                            t.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                            t.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {t.status === 'paid' ? 'Pago' : t.status === 'received' ? 'Recebido' : t.status === 'partial' ? 'Parcial' : t.status === 'pending' ? 'Pendente' : t.status === 'to_receive' ? 'A receber' : 'Sem cobrança'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Relatório de Investimentos ── */}
      {activeTab === 'investments' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-gray-900 dark:text-white text-lg min-w-[60px] text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Planejado</p>
              <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(invTotals.planned * 100)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total Realizado</p>
              <p className="font-bold text-green-600">{formatCurrency(invTotals.actual * 100)}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Investimentos Mensais — Meta vs Realizado</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={investmentYearData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Planejado" fill="#C4B5FD" radius={[3,3,0,0]} />
                <Bar dataKey="Realizado" fill="#7C3AED" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {invByType.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Por Tipo de Investimento</h3>
              <div className="space-y-4">
                {invByType.map((item, i) => {
                  const pct = item.Planejado > 0 ? Math.min((item.Realizado / item.Planejado) * 100, 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                        <span className="text-xs text-gray-500">{formatCurrency(item.Realizado * 100)} / {formatCurrency(item.Planejado * 100)}</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                        <div className="h-2 rounded-full bg-purple-600 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 text-right">{pct.toFixed(0)}%</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Relatório de Patrimônio ── */}
      {activeTab === 'patrimony' && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total de Ativos</p>
              <p className="font-bold text-green-600">{formatCurrency(totalAssets)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">Total de Passivos</p>
              <p className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</p>
            </div>
            <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center`}>
              <p className="text-xs text-gray-500 mb-1">Patrimônio Líquido</p>
              <p className={`font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(netWorth)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {assetByCategory.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ativos por Categoria</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={assetByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                      {assetByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Detalhamento</h3>
              </div>
              {patrimonyItems.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhum item cadastrado</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {patrimonyItems.map(p => {
                    const val = p.itemType === 'asset' ? p.purchaseValue + p.appreciation - p.depreciation : p.debtValue;
                    return (
                      <div key={p.id} className="flex items-center justify-between px-6 py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{p.itemType === 'asset' ? 'Ativo' : 'Passivo'} · {p.category}</p>
                        </div>
                        <span className={`font-semibold text-sm ${p.itemType === 'asset' ? 'text-green-600' : 'text-red-600'}`}>
                          {p.itemType === 'liability' ? '-' : ''}{formatCurrency(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Relatório por Categoria ── */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setYear(y => y - 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
            <span className="font-semibold text-gray-900 dark:text-white text-lg min-w-[60px] text-center">{year}</span>
            <button onClick={() => setYear(y => y + 1)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Despesas por Categoria (ano)</h3>
              {categoryAnnual.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhuma despesa paga neste ano</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={categoryAnnual} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                      {categoryAnnual.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v * 100)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">Ranking de Categorias</h3>
              </div>
              {categoryAnnual.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">Nenhuma despesa neste ano</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {categoryAnnual.map((d, i) => {
                    const pct = totalCategoryAnnual > 0 ? (d.value / totalCategoryAnnual) * 100 : 0;
                    return (
                      <div key={d.name} className="px-6 py-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{d.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(d.value * 100)}</span>
                            <span className="text-xs text-gray-400 ml-2">{pct.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
