import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

// ─── Inicialização das tabelas ────────────────────────────────────────────────
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'tag',
      color TEXT NOT NULL DEFAULT '#6B7280',
      type TEXT NOT NULL,
      is_default BOOLEAN DEFAULT FALSE,
      is_favorite BOOLEAN DEFAULT FALSE,
      subcategories TEXT DEFAULT '[]',
      PRIMARY KEY (id, user_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      paid_amount NUMERIC,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      subcategory_id TEXT,
      due_date TEXT NOT NULL,
      payment_date TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      recurrence TEXT DEFAULT '{"type":"once"}',
      group_id TEXT,
      notes TEXT,
      PRIMARY KEY (id, user_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS investments (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      planned_amount NUMERIC NOT NULL DEFAULT 0,
      actual_amount NUMERIC NOT NULL DEFAULT 0,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      PRIMARY KEY (id, user_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS patrimony_items (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      item_type TEXT NOT NULL,
      category TEXT NOT NULL,
      purchase_value NUMERIC NOT NULL DEFAULT 0,
      appreciation NUMERIC NOT NULL DEFAULT 0,
      depreciation NUMERIC NOT NULL DEFAULT 0,
      debt_value NUMERIC NOT NULL DEFAULT 0,
      notes TEXT,
      PRIMARY KEY (id, user_id)
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS monthly_budgets (
      id TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category_id TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      planned_amount NUMERIC NOT NULL DEFAULT 0,
      PRIMARY KEY (id, user_id)
    )
  `;
  // Adiciona coluna avatar_url se não existir (migração segura)
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`;

  await sql`
    CREATE TABLE IF NOT EXISTS password_reset_codes (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      code TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL
    )
  `;
}

// ─── Usuários ─────────────────────────────────────────────────────────────────
export async function getUserByEmail(email: string) {
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] || null;
}

export async function getUserById(id: number) {
  const rows = await sql`SELECT * FROM users WHERE id = ${id} LIMIT 1`;
  return rows[0] || null;
}

export async function createUser(name: string, email: string, passwordHash: string): Promise<number> {
  const rows = await sql`
    INSERT INTO users (name, email, password_hash) VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id
  `;
  return rows[0].id;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  await sql`UPDATE users SET password_hash = ${passwordHash} WHERE id = ${userId}`;
}

export async function updateUserAvatar(userId: number, avatarUrl: string | null) {
  await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userId}`;
}

export async function updateUserName(userId: number, name: string) {
  await sql`UPDATE users SET name = ${name} WHERE id = ${userId}`;
}

// ─── Reset de senha ───────────────────────────────────────────────────────────
export async function saveResetCode(userId: number, code: string, expiresAt: string) {
  await sql`
    INSERT INTO password_reset_codes (user_id, code, expires_at)
    VALUES (${userId}, ${code}, ${expiresAt})
    ON CONFLICT (user_id) DO UPDATE SET code = EXCLUDED.code, expires_at = EXCLUDED.expires_at
  `;
}

export async function getResetCode(userId: number) {
  const rows = await sql`SELECT * FROM password_reset_codes WHERE user_id = ${userId} LIMIT 1`;
  return rows[0] || null;
}

export async function deleteResetCode(userId: number) {
  await sql`DELETE FROM password_reset_codes WHERE user_id = ${userId}`;
}

// ─── Categorias ───────────────────────────────────────────────────────────────
export async function getUserCategories(userId: number) {
  return sql`SELECT * FROM categories WHERE user_id = ${userId}`;
}

export async function upsertCategory(data: {
  id: string; userId: number; name: string; icon: string; color: string;
  type: string; isDefault: boolean; isFavorite: boolean; subcategories: string;
}) {
  await sql`
    INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_favorite, subcategories)
    VALUES (${data.id}, ${data.userId}, ${data.name}, ${data.icon}, ${data.color}, ${data.type}, ${data.isDefault}, ${data.isFavorite}, ${data.subcategories})
    ON CONFLICT (id, user_id) DO UPDATE SET
      name = EXCLUDED.name, icon = EXCLUDED.icon, color = EXCLUDED.color,
      is_favorite = EXCLUDED.is_favorite, subcategories = EXCLUDED.subcategories
  `;
}

export async function deleteCategory(id: string, userId: number) {
  await sql`DELETE FROM categories WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Transações ───────────────────────────────────────────────────────────────
export async function getUserTransactions(userId: number) {
  return sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY due_date DESC`;
}

export async function upsertTransaction(data: {
  id: string; userId: number; type: string; description: string; amount: number;
  paidAmount?: number | null; categoryId: string; categoryName: string;
  subcategoryId?: string | null; dueDate: string; paymentDate?: string | null;
  status: string; recurrence: string; groupId?: string | null; notes?: string | null;
}) {
  await sql`
    INSERT INTO transactions (id, user_id, type, description, amount, paid_amount, category_id, category_name,
      subcategory_id, due_date, payment_date, status, recurrence, group_id, notes)
    VALUES (${data.id}, ${data.userId}, ${data.type}, ${data.description}, ${data.amount},
      ${data.paidAmount ?? null}, ${data.categoryId}, ${data.categoryName},
      ${data.subcategoryId ?? null}, ${data.dueDate}, ${data.paymentDate ?? null},
      ${data.status}, ${data.recurrence}, ${data.groupId ?? null}, ${data.notes ?? null})
    ON CONFLICT (id, user_id) DO UPDATE SET
      type = EXCLUDED.type, description = EXCLUDED.description, amount = EXCLUDED.amount,
      paid_amount = EXCLUDED.paid_amount, category_id = EXCLUDED.category_id,
      category_name = EXCLUDED.category_name, subcategory_id = EXCLUDED.subcategory_id,
      due_date = EXCLUDED.due_date, payment_date = EXCLUDED.payment_date,
      status = EXCLUDED.status, recurrence = EXCLUDED.recurrence,
      group_id = EXCLUDED.group_id, notes = EXCLUDED.notes
  `;
}

export async function deleteTransaction(id: string, userId: number) {
  await sql`DELETE FROM transactions WHERE id = ${id} AND user_id = ${userId}`;
}

export async function deleteTransactionsByGroupId(groupId: string, userId: number) {
  await sql`DELETE FROM transactions WHERE group_id = ${groupId} AND user_id = ${userId}`;
}

// ─── Investimentos ────────────────────────────────────────────────────────────
export async function getUserInvestments(userId: number) {
  return sql`SELECT * FROM investments WHERE user_id = ${userId}`;
}

export async function upsertInvestment(data: {
  id: string; userId: number; description: string; type: string;
  plannedAmount: number; actualAmount: number; month: number; year: number;
}) {
  await sql`
    INSERT INTO investments (id, user_id, description, type, planned_amount, actual_amount, month, year)
    VALUES (${data.id}, ${data.userId}, ${data.description}, ${data.type}, ${data.plannedAmount}, ${data.actualAmount}, ${data.month}, ${data.year})
    ON CONFLICT (id, user_id) DO UPDATE SET
      description = EXCLUDED.description, type = EXCLUDED.type,
      planned_amount = EXCLUDED.planned_amount, actual_amount = EXCLUDED.actual_amount,
      month = EXCLUDED.month, year = EXCLUDED.year
  `;
}

export async function deleteInvestment(id: string, userId: number) {
  await sql`DELETE FROM investments WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Patrimônio ───────────────────────────────────────────────────────────────
export async function getUserPatrimonyItems(userId: number) {
  return sql`SELECT * FROM patrimony_items WHERE user_id = ${userId}`;
}

export async function upsertPatrimonyItem(data: {
  id: string; userId: number; name: string; itemType: string; category: string;
  purchaseValue: number; appreciation: number; depreciation: number;
  debtValue: number; notes?: string | null;
}) {
  await sql`
    INSERT INTO patrimony_items (id, user_id, name, item_type, category, purchase_value, appreciation, depreciation, debt_value, notes)
    VALUES (${data.id}, ${data.userId}, ${data.name}, ${data.itemType}, ${data.category},
      ${data.purchaseValue}, ${data.appreciation}, ${data.depreciation}, ${data.debtValue}, ${data.notes ?? null})
    ON CONFLICT (id, user_id) DO UPDATE SET
      name = EXCLUDED.name, item_type = EXCLUDED.item_type, category = EXCLUDED.category,
      purchase_value = EXCLUDED.purchase_value, appreciation = EXCLUDED.appreciation,
      depreciation = EXCLUDED.depreciation, debt_value = EXCLUDED.debt_value, notes = EXCLUDED.notes
  `;
}

export async function deletePatrimonyItem(id: string, userId: number) {
  await sql`DELETE FROM patrimony_items WHERE id = ${id} AND user_id = ${userId}`;
}

// ─── Orçamentos ───────────────────────────────────────────────────────────────
export async function getUserMonthlyBudgets(userId: number) {
  return sql`SELECT * FROM monthly_budgets WHERE user_id = ${userId}`;
}

export async function upsertMonthlyBudget(data: {
  id: string; userId: number; categoryId: string; month: number;
  year: number; plannedAmount: number;
}) {
  await sql`
    INSERT INTO monthly_budgets (id, user_id, category_id, month, year, planned_amount)
    VALUES (${data.id}, ${data.userId}, ${data.categoryId}, ${data.month}, ${data.year}, ${data.plannedAmount})
    ON CONFLICT (id, user_id) DO UPDATE SET
      category_id = EXCLUDED.category_id, month = EXCLUDED.month,
      year = EXCLUDED.year, planned_amount = EXCLUDED.planned_amount
  `;
}
