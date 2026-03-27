import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = process.env.DB_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'dominio-financeiro.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma('journal_mode = WAL');
  _db.pragma('foreign_keys = ON');
  initSchema(_db);
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense','investment')),
      is_default INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      subcategories TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income','expense')),
      description TEXT NOT NULL,
      amount INTEGER NOT NULL,
      paid_amount INTEGER,
      category_id TEXT NOT NULL,
      category_name TEXT NOT NULL,
      subcategory_id TEXT,
      due_date TEXT NOT NULL,
      payment_date TEXT,
      status TEXT NOT NULL,
      recurrence TEXT NOT NULL DEFAULT '{"type":"once"}',
      group_id TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('emergency','long_term','future_projects')),
      planned_amount INTEGER NOT NULL DEFAULT 0,
      actual_amount INTEGER NOT NULL DEFAULT 0,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS patrimony_items (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      item_type TEXT NOT NULL CHECK(item_type IN ('asset','liability')),
      category TEXT NOT NULL,
      purchase_value INTEGER NOT NULL DEFAULT 0,
      appreciation INTEGER NOT NULL DEFAULT 0,
      depreciation INTEGER NOT NULL DEFAULT 0,
      debt_value INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monthly_budgets (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      category_id TEXT NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      planned_amount INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, category_id, month, year),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS password_reset_codes (
      user_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      PRIMARY KEY(user_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
}

// ─── User helpers ─────────────────────────────────────────────
export function getUserByEmail(email: string) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function getUserById(id: number) {
  return getDb().prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
}

export function createUser(name: string, email: string, passwordHash: string): number {
  const result = getDb().prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name, email, passwordHash);
  return result.lastInsertRowid as number;
}

export function updateUserPassword(id: number, passwordHash: string) {
  getDb().prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?').run(passwordHash, id);
}

// ─── Password reset ───────────────────────────────────────────
export function saveResetCode(userId: number, code: string, expiresAt: string) {
  getDb().prepare(
    'INSERT OR REPLACE INTO password_reset_codes (user_id, code, expires_at) VALUES (?, ?, ?)'
  ).run(userId, code, expiresAt);
}

export function getResetCode(userId: number) {
  return getDb().prepare('SELECT * FROM password_reset_codes WHERE user_id = ?').get(userId) as any;
}

export function deleteResetCode(userId: number) {
  getDb().prepare('DELETE FROM password_reset_codes WHERE user_id = ?').run(userId);
}

// ─── Categories ───────────────────────────────────────────────
export function getUserCategories(userId: number) {
  return getDb().prepare('SELECT * FROM categories WHERE user_id = ?').all(userId) as any[];
}

export function upsertCategory(data: any) {
  getDb().prepare(`
    INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_favorite, subcategories, updated_at)
    VALUES (@id, @userId, @name, @icon, @color, @type, @isDefault, @isFavorite, @subcategories, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, icon=excluded.icon, color=excluded.color,
      is_favorite=excluded.is_favorite, subcategories=excluded.subcategories,
      updated_at=datetime('now')
  `).run({
    id: data.id, userId: data.userId, name: data.name, icon: data.icon,
    color: data.color, type: data.type, isDefault: data.isDefault ? 1 : 0,
    isFavorite: data.isFavorite ? 1 : 0, subcategories: JSON.stringify(data.subcategories || [])
  });
}

export function deleteCategory(id: string, userId: number) {
  getDb().prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId);
}

// ─── Transactions ─────────────────────────────────────────────
export function getUserTransactions(userId: number) {
  return getDb().prepare('SELECT * FROM transactions WHERE user_id = ?').all(userId) as any[];
}

export function upsertTransaction(data: any) {
  getDb().prepare(`
    INSERT INTO transactions (id, user_id, type, description, amount, paid_amount, category_id, category_name, subcategory_id, due_date, payment_date, status, recurrence, group_id, notes, updated_at)
    VALUES (@id, @userId, @type, @description, @amount, @paidAmount, @categoryId, @categoryName, @subcategoryId, @dueDate, @paymentDate, @status, @recurrence, @groupId, @notes, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type, description=excluded.description, amount=excluded.amount,
      paid_amount=excluded.paid_amount, category_id=excluded.category_id, category_name=excluded.category_name,
      subcategory_id=excluded.subcategory_id, due_date=excluded.due_date, payment_date=excluded.payment_date,
      status=excluded.status, recurrence=excluded.recurrence, group_id=excluded.group_id,
      notes=excluded.notes, updated_at=datetime('now')
  `).run({
    id: data.id, userId: data.userId, type: data.type, description: data.description,
    amount: data.amount, paidAmount: data.paidAmount ?? null, categoryId: data.categoryId,
    categoryName: data.categoryName, subcategoryId: data.subcategoryId ?? null,
    dueDate: data.dueDate, paymentDate: data.paymentDate ?? null, status: data.status,
    recurrence: JSON.stringify(data.recurrence || { type: 'once' }),
    groupId: data.groupId ?? null, notes: data.notes ?? null
  });
}

export function deleteTransaction(id: string, userId: number) {
  getDb().prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(id, userId);
}

export function deleteTransactionsByGroupId(groupId: string, userId: number) {
  getDb().prepare('DELETE FROM transactions WHERE group_id = ? AND user_id = ?').run(groupId, userId);
}

// ─── Investments ──────────────────────────────────────────────
export function getUserInvestments(userId: number) {
  return getDb().prepare('SELECT * FROM investments WHERE user_id = ?').all(userId) as any[];
}

export function upsertInvestment(data: any) {
  getDb().prepare(`
    INSERT INTO investments (id, user_id, description, type, planned_amount, actual_amount, month, year, updated_at)
    VALUES (@id, @userId, @description, @type, @plannedAmount, @actualAmount, @month, @year, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      description=excluded.description, type=excluded.type,
      planned_amount=excluded.planned_amount, actual_amount=excluded.actual_amount,
      month=excluded.month, year=excluded.year, updated_at=datetime('now')
  `).run(data);
}

export function deleteInvestment(id: string, userId: number) {
  getDb().prepare('DELETE FROM investments WHERE id = ? AND user_id = ?').run(id, userId);
}

// ─── Patrimony ────────────────────────────────────────────────
export function getUserPatrimonyItems(userId: number) {
  return getDb().prepare('SELECT * FROM patrimony_items WHERE user_id = ?').all(userId) as any[];
}

export function upsertPatrimonyItem(data: any) {
  getDb().prepare(`
    INSERT INTO patrimony_items (id, user_id, name, item_type, category, purchase_value, appreciation, depreciation, debt_value, notes, updated_at)
    VALUES (@id, @userId, @name, @itemType, @category, @purchaseValue, @appreciation, @depreciation, @debtValue, @notes, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name, item_type=excluded.item_type, category=excluded.category,
      purchase_value=excluded.purchase_value, appreciation=excluded.appreciation,
      depreciation=excluded.depreciation, debt_value=excluded.debt_value,
      notes=excluded.notes, updated_at=datetime('now')
  `).run(data);
}

export function deletePatrimonyItem(id: string, userId: number) {
  getDb().prepare('DELETE FROM patrimony_items WHERE id = ? AND user_id = ?').run(id, userId);
}

// ─── Monthly Budgets ──────────────────────────────────────────
export function getUserMonthlyBudgets(userId: number) {
  return getDb().prepare('SELECT * FROM monthly_budgets WHERE user_id = ?').all(userId) as any[];
}

export function upsertMonthlyBudget(data: any) {
  getDb().prepare(`
    INSERT INTO monthly_budgets (id, user_id, category_id, month, year, planned_amount, updated_at)
    VALUES (@id, @userId, @categoryId, @month, @year, @plannedAmount, datetime('now'))
    ON CONFLICT(user_id, category_id, month, year) DO UPDATE SET
      planned_amount=excluded.planned_amount, updated_at=datetime('now')
  `).run(data);
}
