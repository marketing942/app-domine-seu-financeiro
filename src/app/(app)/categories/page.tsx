'use client';

import { useState } from 'react';
import { useFinance } from '@/lib/finance-context';
import { Category } from '@/types/finance';
import { Plus, Pencil, Trash2, Loader2, Tag } from 'lucide-react';
import { cn, generateId } from '@/lib/utils';

const COLORS = ['#6366F1','#0EA5E9','#F97316','#EF4444','#8B5CF6','#EC4899','#10B981','#F59E0B','#64748B','#06B6D4','#84CC16','#A78BFA'];
const ICONS = ['home','car','utensils','heart','book','smile','credit-card','briefcase','laptop','trending-up','shopping-bag','music','camera','gift','star','zap','coffee','phone','globe','shield'];

export default function CategoriesPage() {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useFinance();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('tag');
  const [color, setColor] = useState('#6366F1');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = categories.filter(c => c.type === tab);

  function openNew() { setEditing(null); setName(''); setIcon('tag'); setColor('#6366F1'); setShowForm(true); }
  function openEdit(c: Category) { setEditing(c); setName(c.name); setIcon(c.icon); setColor(c.color); setShowForm(true); }
  function cancel() { setShowForm(false); setEditing(null); }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCategory({ ...editing, name: name.trim(), icon, color });
      } else {
        await addCategory({ name: name.trim(), icon, color, type: tab, isDefault: false, isFavorite: false, subcategories: [] });
      }
      cancel();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta categoria?')) return;
    setDeleting(id);
    try { await deleteCategory(id); } finally { setDeleting(null); }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-primary-600" /></div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['expense', 'income'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 rounded-lg text-sm font-medium transition',
                tab === t ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50')}>
              {t === 'expense' ? 'Despesas' : 'Receitas'}
            </button>
          ))}
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
          <Plus size={16} /> Nova categoria
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">{editing ? 'Editar categoria' : 'Nova categoria'}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Nome da categoria"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Cor</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn('w-8 h-8 rounded-full transition', color === c ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-white' : '')} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={cancel} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium transition">
              Cancelar
            </button>
            <button onClick={handleSave} disabled={saving || !name.trim()}
              className="flex-1 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <div key={c.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: c.color + '20' }}>
              <Tag size={18} style={{ color: c.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 dark:text-white truncate">{c.name}</p>
              <p className="text-xs text-gray-500">{c.isDefault ? 'Padrão' : 'Personalizada'}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openEdit(c)}
                className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition">
                <Pencil size={15} />
              </button>
              {!c.isDefault && (
                <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                  {deleting === c.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
