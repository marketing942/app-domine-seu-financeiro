'use client';

import { useState, useMemo } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Investment, InvestmentType } from '@/types/finance';
import { formatCurrency, getMonthName, maskCurrency, parseCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, Loader2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_LABELS: Record<InvestmentType, { label: string; color: string }> = {
  emergency: { label: 'Reserva de emergência', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  long_term: { label: 'Longo prazo', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  future_projects: { label: 'Projetos futuros', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

export default function InvestmentsPage() {
  const { investments, addInvestment, updateInvestment, deleteInvestment, loading } = useFinance();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [description, setDescription] = useState('');
  const [type, setType] = useState<InvestmentType>('emergency');
  const [plannedAmount, setPlannedAmount] = useState('');
  const [actualAmount, setActualAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() =>
    investments.filter(i => i.month === month && i.year === year),
    [investments, month, year]);

  const totalPlanned = filtered.reduce((s, i) => s + i.plannedAmount, 0);
  const totalActual = filtered.reduce((s, i) => s + i.actualAmount, 0);

  function prevMonth() { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); }

  function openNew() {
    setEditing(null); setDescription(''); setType('emergency');
    setPlannedAmount(''); setActualAmount(''); setShowModal(true);
  }
  function openEdit(i: Investment) {
    setEditing(i); setDescription(i.description); setType(i.type);
    setPlannedAmount((i.plannedAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setActualAmount((i.actualAmount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditing(null); }

  async function handleSave() {
    if (!description.trim()) return;
    setSaving(true);
    try {
      const data = {
        description: description.trim(), type,
        plannedAmount: parseCurrency(plannedAmount),
        actualAmount: parseCurrency(actualAmount),
        month, year,
      };
      if (editing) await updateInvestment({ ...editing, ...data });
      else await addInvestment(data);
      closeModal();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este investimento?')) return;
    setDeleting(id);
    try { await deleteInvestment(id); } finally { setDeleting(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronLeft size={18} /></button>
          <span className="font-semibold text-gray-900 dark:text-white min-w-[150px] text-center">{getMonthName(month)} {year}</span>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"><ChevronRight size={18} /></button>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} /> Novo investimento
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Planejado</p>
          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(totalPlanned)}</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-center">
          <p className="text-xs text-gray-500 mb-1">Realizado</p>
          <p className="font-bold text-green-600">{formatCurrency(totalActual)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Nenhum investimento neste mês</p>
            <p className="text-sm">Clique em "Novo investimento" para adicionar</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(inv => {
              const pct = inv.plannedAmount > 0 ? Math.min((inv.actualAmount / inv.plannedAmount) * 100, 100) : 0;
              const info = TYPE_LABELS[inv.type];
              return (
                <div key={inv.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{inv.description}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${info.color}`}>{info.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(inv.actualAmount)}</p>
                        <p className="text-xs text-gray-500">de {formatCurrency(inv.plannedAmount)}</p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(inv)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"><Pencil size={15} /></button>
                        <button onClick={() => handleDelete(inv.id)} disabled={deleting === inv.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                          {deleting === inv.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>
                  {inv.plannedAmount > 0 && (
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-600 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Editar investimento' : 'Novo investimento'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Tesouro Direto"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as InvestmentType)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="emergency">Reserva de emergência</option>
                <option value="long_term">Longo prazo</option>
                <option value="future_projects">Projetos futuros</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Planejado (R$)</label>
                <input value={plannedAmount} onChange={e => setPlannedAmount(maskCurrency(e.target.value))} placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Realizado (R$)</label>
                <input value={actualAmount} onChange={e => setActualAmount(maskCurrency(e.target.value))} placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !description.trim()}
                className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
                {saving && <Loader2 size={15} className="animate-spin" />}
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
