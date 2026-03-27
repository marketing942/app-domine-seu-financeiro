import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getSession } from '@/lib/auth';

async function requireAuth(req: NextRequest) {
  const session = await getSession();
  if (!session) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = session.userId;
  const rawCategories = db.getUserCategories(userId);
  const rawTransactions = db.getUserTransactions(userId);
  const rawInvestments = db.getUserInvestments(userId);
  const rawPatrimony = db.getUserPatrimonyItems(userId);
  const rawBudgets = db.getUserMonthlyBudgets(userId);

  // Parse JSON fields
  const categories = rawCategories.map((c: any) => ({
    id: c.id, name: c.name, icon: c.icon, color: c.color,
    type: c.type, isDefault: !!c.is_default, isFavorite: !!c.is_favorite,
    subcategories: JSON.parse(c.subcategories || '[]'),
  }));

  const transactions = rawTransactions.map((t: any) => ({
    id: t.id, type: t.type, description: t.description,
    amount: t.amount, paidAmount: t.paid_amount,
    categoryId: t.category_id, categoryName: t.category_name,
    subcategoryId: t.subcategory_id, dueDate: t.due_date,
    paymentDate: t.payment_date, status: t.status,
    recurrence: JSON.parse(t.recurrence || '{"type":"once"}'),
    groupId: t.group_id, notes: t.notes,
    createdAt: t.created_at, updatedAt: t.updated_at,
  }));

  const investments = rawInvestments.map((i: any) => ({
    id: i.id, description: i.description, type: i.type,
    plannedAmount: i.planned_amount, actualAmount: i.actual_amount,
    month: i.month, year: i.year,
    createdAt: i.created_at, updatedAt: i.updated_at,
  }));

  const patrimonyItems = rawPatrimony.map((p: any) => ({
    id: p.id, name: p.name, itemType: p.item_type, category: p.category,
    purchaseValue: p.purchase_value, appreciation: p.appreciation,
    depreciation: p.depreciation, debtValue: p.debt_value,
    notes: p.notes, createdAt: p.created_at, updatedAt: p.updated_at,
  }));

  const monthlyBudgets = rawBudgets.map((b: any) => ({
    id: b.id, categoryId: b.category_id, month: b.month, year: b.year,
    plannedAmount: b.planned_amount,
  }));

  return NextResponse.json({ categories, transactions, investments, patrimonyItems, monthlyBudgets });
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = session.userId;
  const body = await req.json();
  const { action, data } = body;

  try {
    if (action === 'upsert-category') {
      db.upsertCategory({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-category') {
      db.deleteCategory(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-transaction') {
      db.upsertTransaction({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-transaction') {
      db.deleteTransaction(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-transactions-group') {
      db.deleteTransactionsByGroupId(data.groupId, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-investment') {
      db.upsertInvestment({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-investment') {
      db.deleteInvestment(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-patrimony') {
      db.upsertPatrimonyItem({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-patrimony') {
      db.deletePatrimonyItem(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-budget') {
      db.upsertMonthlyBudget({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
