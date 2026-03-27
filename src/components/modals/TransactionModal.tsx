'use client';

import { useState, useEffect } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Transaction, TransactionStatus, RecurrenceType } from '@/types/finance';
import { X, Loader2 } from 'lucide-react';
import { maskCurrency, maskDate, parseDate, parseCurrency, generateId } from '@/lib/utils';

interface Props {
  transaction?: Transaction | null;
  onClose: () => void;
}

const STATUS_OPTIONS_EXPENSE: { value: TransactionStatus; label: string }[] = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'partial', label: 'Parcial' },
  { value: 'no_demand', label: 'Sem cobrança' },
];

const STATUS_OPTIONS_INCOME: { value: TransactionStatus; label: string }[] = [
  { value: 'to_receive', label: 'A receber' },
  { value: 'received', label: 'Recebido' },
  { value: 'partial', label: 'Parcial' },
];

export default function TransactionModal({ transaction, onClose }: Props) {
  const { categories, addTransaction, updateTransaction } = useFinance();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [type, setType] = useState<'income' | 'expense'>(transaction?.type || 'expense');
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction ? (transaction.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '');
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || '');
  const [dueDate, setDueDate] = useState(transaction?.dueDate ? transaction.dueDate.split('-').reverse().join('/') : '');
  const [status, setStatus] = useState<TransactionStatus>(transaction?.status || 'pending');
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>(transaction?.recurrence?.type || 'once');
  const [installments, setInstallments] = useState(transaction?.recurrence?.installments || 2);
  const [notes, setNotes] = useState(transaction?.notes || '');

  const filteredCategories = categories.filter(c => c.type === type);
  const selectedCategory = categories.find(c => c.id === categoryId);

  useEffect(() => {
    if (!categoryId && filteredCategories.length > 0) {
      setCategoryId(filteredCategories[0].id);
    }
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!description.trim()) { setError('Informe a descrição'); return; }
    if (!categoryId) { setError('Selecione uma categoria'); return; }
    const parsedDate = parseDate(dueDate);
    if (!parsedDate) { setError('Data inválida (use DD/MM/AAAA)'); return; }
    const parsedAmount = parseCurrency(amount);
    if (parsedAmount <= 0) { setError('Valor deve ser maior que zero'); return; }

    setLoading(true);
    try {
      const cat = categories.find(c => c.id === categoryId);
      const base = {
        type,
        description: description.trim(),
        amount: parsedAmount,
        categoryId,
        categoryName: cat?.name || '',
        dueDate: parsedDate,
        status,
        recurrence: recurrenceType === 'installment'
          ? { type: recurrenceType, installments, currentInstallment: 1 }
          : { type: recurrenceType },
        notes: notes.trim() || undefined,
      };

      if (transaction) {
        await updateTransaction({ ...transaction, ...base });
      } else {
        if (recurrenceType === 'installment') {
          const groupId = generateId();
          for (let i = 0; i < installments; i++) {
            const d = new Date(parsedDate + 'T00:00:00');
            d.setMonth(d.getMonth() + i);
            const dd = d.toISOString().split('T')[0];
            await addTransaction({
              ...base,
              dueDate: dd,
              groupId,
              recurrence: { type: 'installment', installments, currentInstallment: i + 1 },
            });
          }
        } else if (recurrenceType === 'monthly') {
          const groupId = generateId();
          for (let i = 0; i < 12; i++) {
            const d = new Date(parsedDate + 'T00:00:00');
            d.setMonth(d.getMonth() + i);
            const dd = d.toISOString().split('T')[0];
            await addTransaction({ ...base, dueDate: dd, groupId });
          }
        } else {
          await addTransaction(base);
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  const statusOptions = type === 'expense' ? STATUS_OPTIONS_EXPENSE : STATUS_OPTIONS_INCOME;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {transaction ? 'Editar transação' : 'Nova transação'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Type toggle */}
          <div className="flex gap-2">
            {(['expense', 'income'] as const).map(t => (
              <button key={t} type="button" onClick={() => { setType(t); setStatus(t === 'expense' ? 'pending' : 'to_receive'); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition ${type === t
                  ? t === 'expense' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
                {t === 'expense' ? 'Despesa' : 'Receita'}
              </button>
            ))}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <input value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ex: Conta de luz"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor (R$)</label>
              <input value={amount} onChange={e => setAmount(maskCurrency(e.target.value))} required placeholder="0,00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vencimento</label>
              <input value={dueDate} onChange={e => setDueDate(maskDate(e.target.value))} required placeholder="DD/MM/AAAA" maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)} required
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
              <option value="">Selecione...</option>
              {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as TransactionStatus)}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
              {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {!transaction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Recorrência</label>
              <select value={recurrenceType} onChange={e => setRecurrenceType(e.target.value as RecurrenceType)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
                <option value="once">Única</option>
                <option value="monthly">Mensal (12 meses)</option>
                <option value="installment">Parcelado</option>
              </select>
              {recurrenceType === 'installment' && (
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1">Número de parcelas</label>
                  <input type="number" min={2} max={60} value={installments} onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações (opcional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Notas adicionais..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm font-medium">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg transition text-sm font-semibold flex items-center justify-center gap-2">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Salvando...' : transaction ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
