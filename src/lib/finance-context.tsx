'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { FinanceState, Transaction, Category, Investment, PatrimonyItem, MonthlyBudget } from '@/types/finance';
import { DEFAULT_CATEGORIES } from '@/data/default-categories';
import { generateId } from '@/lib/utils';

interface FinanceContextType extends FinanceState {
  loading: boolean;
  // Transactions
  addTransaction: (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (t: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactionGroup: (groupId: string) => Promise<void>;
  // Categories
  addCategory: (c: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  // Investments
  addInvestment: (i: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInvestment: (i: Investment) => Promise<void>;
  deleteInvestment: (id: string) => Promise<void>;
  // Patrimony
  addPatrimonyItem: (p: Omit<PatrimonyItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updatePatrimonyItem: (p: PatrimonyItem) => Promise<void>;
  deletePatrimonyItem: (id: string) => Promise<void>;
  // Budgets
  upsertBudget: (b: Omit<MonthlyBudget, 'id'>) => Promise<void>;
  // Reload
  reload: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | null>(null);

async function apiPost(action: string, data?: any) {
  const res = await fetch('/api/finance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, data }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro na operação');
  }
  return res.json();
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FinanceState>({
    transactions: [], categories: [], investments: [], patrimonyItems: [], monthlyBudgets: [],
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/finance');
      if (!res.ok) return;
      const data = await res.json();
      // Merge default categories with user categories
      const userCatIds = new Set(data.categories.map((c: Category) => c.id));
      const defaults = DEFAULT_CATEGORIES.filter(c => !userCatIds.has(c.id));
      setState({
        ...data,
        categories: [...defaults, ...data.categories],
      });
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const now = () => new Date().toISOString();

  // ─── Transactions ─────────────────────────────────────────────
  const addTransaction = async (t: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const item: Transaction = { ...t, id: generateId(), createdAt: now(), updatedAt: now() };
    await apiPost('upsert-transaction', item);
    setState(s => ({ ...s, transactions: [...s.transactions, item] }));
  };

  const updateTransaction = async (t: Transaction) => {
    const item = { ...t, updatedAt: now() };
    await apiPost('upsert-transaction', item);
    setState(s => ({ ...s, transactions: s.transactions.map(x => x.id === t.id ? item : x) }));
  };

  const deleteTransaction = async (id: string) => {
    await apiPost('delete-transaction', { id });
    setState(s => ({ ...s, transactions: s.transactions.filter(x => x.id !== id) }));
  };

  const deleteTransactionGroup = async (groupId: string) => {
    await apiPost('delete-transactions-group', { groupId });
    setState(s => ({ ...s, transactions: s.transactions.filter(x => x.groupId !== groupId) }));
  };

  // ─── Categories ───────────────────────────────────────────────
  const addCategory = async (c: Omit<Category, 'id'>) => {
    const item: Category = { ...c, id: generateId() };
    await apiPost('upsert-category', item);
    setState(s => ({ ...s, categories: [...s.categories, item] }));
  };

  const updateCategory = async (c: Category) => {
    await apiPost('upsert-category', c);
    setState(s => ({ ...s, categories: s.categories.map(x => x.id === c.id ? c : x) }));
  };

  const deleteCategory = async (id: string) => {
    await apiPost('delete-category', { id });
    setState(s => ({ ...s, categories: s.categories.filter(x => x.id !== id) }));
  };

  // ─── Investments ──────────────────────────────────────────────
  const addInvestment = async (i: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const item: Investment = { ...i, id: generateId(), createdAt: now(), updatedAt: now() };
    await apiPost('upsert-investment', item);
    setState(s => ({ ...s, investments: [...s.investments, item] }));
  };

  const updateInvestment = async (i: Investment) => {
    const item = { ...i, updatedAt: now() };
    await apiPost('upsert-investment', item);
    setState(s => ({ ...s, investments: s.investments.map(x => x.id === i.id ? item : x) }));
  };

  const deleteInvestment = async (id: string) => {
    await apiPost('delete-investment', { id });
    setState(s => ({ ...s, investments: s.investments.filter(x => x.id !== id) }));
  };

  // ─── Patrimony ────────────────────────────────────────────────
  const addPatrimonyItem = async (p: Omit<PatrimonyItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const item: PatrimonyItem = { ...p, id: generateId(), createdAt: now(), updatedAt: now() };
    await apiPost('upsert-patrimony', item);
    setState(s => ({ ...s, patrimonyItems: [...s.patrimonyItems, item] }));
  };

  const updatePatrimonyItem = async (p: PatrimonyItem) => {
    const item = { ...p, updatedAt: now() };
    await apiPost('upsert-patrimony', item);
    setState(s => ({ ...s, patrimonyItems: s.patrimonyItems.map(x => x.id === p.id ? item : x) }));
  };

  const deletePatrimonyItem = async (id: string) => {
    await apiPost('delete-patrimony', { id });
    setState(s => ({ ...s, patrimonyItems: s.patrimonyItems.filter(x => x.id !== id) }));
  };

  // ─── Budgets ──────────────────────────────────────────────────
  const upsertBudget = async (b: Omit<MonthlyBudget, 'id'>) => {
    const existing = state.monthlyBudgets.find(x => x.categoryId === b.categoryId && x.month === b.month && x.year === b.year);
    const item: MonthlyBudget = { ...b, id: existing?.id || generateId() };
    await apiPost('upsert-budget', item);
    setState(s => {
      const filtered = s.monthlyBudgets.filter(x => !(x.categoryId === b.categoryId && x.month === b.month && x.year === b.year));
      return { ...s, monthlyBudgets: [...filtered, item] };
    });
  };

  return (
    <FinanceContext.Provider value={{
      ...state, loading, reload,
      addTransaction, updateTransaction, deleteTransaction, deleteTransactionGroup,
      addCategory, updateCategory, deleteCategory,
      addInvestment, updateInvestment, deleteInvestment,
      addPatrimonyItem, updatePatrimonyItem, deletePatrimonyItem,
      upsertBudget,
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
