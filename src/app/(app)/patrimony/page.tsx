'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { PatrimonyItem, PatrimonyItemType, PatrimonyCategory } from '@/types/finance';
import { formatCurrency, maskCurrency, parseCurrency } from '@/lib/utils';
import { Plus, Pencil, Trash2, Loader2, X, TrendingUp, TrendingDown, Wallet } from 'lucide-react';

const CATEGORY_LABELS: Record<PatrimonyCategory, string> = {
  real_estate: 'Imóvel', vehicle: 'Veículo', investment: 'Investimento',
  equipment: 'Equipamento', loan: 'Empréstimo', financing: 'Financiamento',
  credit_card: 'Cartão de crédito', other: 'Outro',
};

export default function PatrimonyPage() {
  const { patrimonyItems, addPatrimonyItem, updatePatrimonyItem, deletePatrimonyItem, loading } = useFinance();
  const [tab, setTab] = useState<'asset' | 'liability'>('asset');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PatrimonyItem | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form
  const [name, setName] = useState('');
  const [itemType, setItemType] = useState<PatrimonyItemType>('asset');
  const [category, setCategory] = useState<PatrimonyCategory>('real_estate');
  const [purchaseValue, setPurchaseValue] = useState('');
  const [appreciation, setAppreciation] = useState('');
  const [depreciation, setDepreciation] = useState('');
  const [debtValue, setDebtValue] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const assets = patrimonyItems.filter(p => p.itemType === 'asset');
  const liabilities = patrimonyItems.filter(p => p.itemType === 'liability');
  const totalAssets = assets.reduce((s, p) => s + p.purchaseValue + p.appreciation - p.depreciation, 0);
  const totalLiabilities = liabilities.reduce((s, p) => s + p.debtValue, 0);
  const netWorth = totalAssets - totalLiabilities;

  const displayed = tab === 'asset' ? assets : liabilities;

  function openNew() {
    setEditing(null); setName(''); setItemType(tab); setCategory(tab === 'asset' ? 'real_estate' : 'loan');
    setPurchaseValue(''); setAppreciation(''); setDepreciation(''); setDebtValue(''); setNotes('');
    setShowModal(true);
  }
  function openEdit(p: PatrimonyItem) {
    setEditing(p); setName(p.name); setItemType(p.itemType); setCategory(p.category);
    setPurchaseValue((p.purchaseValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setAppreciation((p.appreciation / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setDepreciation((p.depreciation / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setDebtValue((p.debtValue / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    setNotes(p.notes || ''); setShowModal(true);
  }
  function closeModal() { setShowModal(false); setEditing(null); }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(), itemType, category,
        purchaseValue: parseCurrency(purchaseValue),
        appreciation: parseCurrency(appreciation),
        depreciation: parseCurrency(depreciation),
        debtValue: parseCurrency(debtValue),
        notes: notes.trim() || undefined,
      };
      if (editing) await updatePatrimonyItem({ ...editing, ...data });
      else await addPatrimonyItem(data);
      closeModal();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este item?')) return;
    setDeleting(id);
    try { await deletePatrimonyItem(id); } finally { setDeleting(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg"><TrendingUp size={18} className="text-green-600" /></div>
          <div><p className="text-xs text-gray-500">Ativos</p><p className="font-bold text-green-600">{formatCurrency(totalAssets)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><TrendingDown size={18} className="text-red-600" /></div>
          <div><p className="text-xs text-gray-500">Passivos</p><p className="font-bold text-red-600">{formatCurrency(totalLiabilities)}</p></div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"><Wallet size={18} className="text-blue-600" /></div>
          <div><p className="text-xs text-gray-500">Patrimônio líquido</p><p className={`font-bold ${netWorth >= 0 ? 'text-blue-600' : 'text-red-600'}`}>{formatCurrency(netWorth)}</p></div>
        </div>
      </div>

      {/* Tabs + button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['asset', 'liability'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50'}`}>
              {t === 'asset' ? 'Ativos' : 'Passivos'}
            </button>
          ))}
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} /> Adicionar
        </button>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {displayed.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-2">Nenhum {tab === 'asset' ? 'ativo' : 'passivo'} cadastrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {displayed.map(p => {
              const currentValue = p.itemType === 'asset' ? p.purchaseValue + p.appreciation - p.depreciation : p.debtValue;
              return (
                <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-500">{CATEGORY_LABELS[p.category]}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${p.itemType === 'asset' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(currentValue)}</p>
                    {p.itemType === 'asset' && p.purchaseValue > 0 && (
                      <p className="text-xs text-gray-500">Compra: {formatCurrency(p.purchaseValue)}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      {deleting === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Editar item' : 'Novo item'}</h2>
              <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><X size={20} /></button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Apartamento"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                <select value={itemType} onChange={e => setItemType(e.target.value as PatrimonyItemType)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  <option value="asset">Ativo</option>
                  <option value="liability">Passivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select value={category} onChange={e => setCategory(e.target.value as PatrimonyCategory)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            {itemType === 'asset' ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor de compra (R$)</label>
                  <input value={purchaseValue} onChange={e => setPurchaseValue(maskCurrency(e.target.value))} placeholder="0,00"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valorização (R$)</label>
                  <input value={appreciation} onChange={e => setAppreciation(maskCurrency(e.target.value))} placeholder="0,00"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Depreciação (R$)</label>
                  <input value={depreciation} onChange={e => setDepreciation(maskCurrency(e.target.value))} placeholder="0,00"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor da dívida (R$)</label>
                <input value={debtValue} onChange={e => setDebtValue(maskCurrency(e.target.value))} placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações (opcional)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">Cancelar</button>
              <button onClick={handleSave} disabled={saving || !name.trim()}
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
