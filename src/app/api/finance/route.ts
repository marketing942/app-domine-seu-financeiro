import { NextRequest, NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { initDb } from '@/lib/db';

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

async function requireAuth() {
  const session = await getSession();
  if (!session) return null;
  return session;
}

export async function GET(req: NextRequest) {
  await ensureDb();
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = session.userId;
  const [rawCategories, rawTransactions, rawInvestments, rawPatrimony, rawBudgets] = await Promise.all([
    db.getUserCategories(userId),
    db.getUserTransactions(userId),
    db.getUserInvestments(userId),
    db.getUserPatrimonyItems(userId),
    db.getUserMonthlyBudgets(userId),
  ]);

  const categories = rawCategories.map((c: any) => ({
    id: c.id, name: c.name, icon: c.icon, color: c.color,
    type: c.type, isDefault: !!c.is_default, isFavorite: !!c.is_favorite,
    subcategories: JSON.parse(c.subcategories || '[]'),
  }));

  const transactions = rawTransactions.map((t: any) => ({
    id: t.id, type: t.type, description: t.description,
    amount: Number(t.amount), paidAmount: t.paid_amount ? Number(t.paid_amount) : null,
    categoryId: t.category_id, categoryName: t.category_name,
    subcategoryId: t.subcategory_id, dueDate: t.due_date,
    paymentDate: t.payment_date, status: t.status,
    recurrence: JSON.parse(t.recurrence || '{"type":"once"}'),
    groupId: t.group_id, notes: t.notes,
  }));

  const investments = rawInvestments.map((i: any) => ({
    id: i.id, description: i.description, type: i.type,
    plannedAmount: Number(i.planned_amount), actualAmount: Number(i.actual_amount),
    month: i.month, year: i.year,
  }));

  const patrimonyItems = rawPatrimony.map((p: any) => ({
    id: p.id, name: p.name, itemType: p.item_type, category: p.category,
    purchaseValue: Number(p.purchase_value), appreciation: Number(p.appreciation),
    depreciation: Number(p.depreciation), debtValue: Number(p.debt_value),
    notes: p.notes,
  }));

  const monthlyBudgets = rawBudgets.map((b: any) => ({
    id: b.id, categoryId: b.category_id, month: b.month, year: b.year,
    plannedAmount: Number(b.planned_amount),
  }));

  return NextResponse.json({ categories, transactions, investments, patrimonyItems, monthlyBudgets });
}

export async function POST(req: NextRequest) {
  await ensureDb();
  const session = await requireAuth();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = session.userId;
  const body = await req.json();
  const { action, data } = body;

  try {
    if (action === 'upsert-category') {
      await db.upsertCategory({
        ...data, userId,
        subcategories: JSON.stringify(data.subcategories || []),
      });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-category') {
      await db.deleteCategory(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-transaction') {
      await db.upsertTransaction({
        ...data, userId,
        recurrence: JSON.stringify(data.recurrence || { type: 'once' }),
      });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-transaction') {
      await db.deleteTransaction(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-transactions-group') {
      await db.deleteTransactionsByGroupId(data.groupId, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-investment') {
      await db.upsertInvestment({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-investment') {
      await db.deleteInvestment(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-patrimony') {
      await db.upsertPatrimonyItem({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    if (action === 'delete-patrimony') {
      await db.deletePatrimonyItem(data.id, userId);
      return NextResponse.json({ success: true });
    }
    if (action === 'upsert-budget') {
      await db.upsertMonthlyBudget({ ...data, userId });
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
  } catch (err: any) {
    console.error('[finance API error]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
