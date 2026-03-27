export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'paid' | 'received' | 'pending' | 'partial' | 'no_demand' | 'to_receive';
export type RecurrenceType = 'once' | 'monthly' | 'installment' | 'custom';
export type InvestmentType = 'emergency' | 'long_term' | 'future_projects';
export type PatrimonyItemType = 'asset' | 'liability';
export type PatrimonyCategory = 'real_estate' | 'vehicle' | 'investment' | 'equipment' | 'loan' | 'financing' | 'credit_card' | 'other';

export interface RecurrenceConfig {
  type: RecurrenceType;
  installments?: number;
  currentInstallment?: number;
  customMonths?: number[];
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  paidAmount?: number;
  categoryId: string;
  categoryName: string;
  subcategoryId?: string;
  dueDate: string;
  paymentDate?: string;
  status: TransactionStatus;
  recurrence: RecurrenceConfig;
  groupId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id: string;
  name: string;
  categoryId: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: TransactionType | 'investment';
  isDefault: boolean;
  isFavorite?: boolean;
  subcategories: Subcategory[];
}

export interface Investment {
  id: string;
  description: string;
  type: InvestmentType;
  plannedAmount: number;
  actualAmount: number;
  month: number;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export interface PatrimonyItem {
  id: string;
  name: string;
  itemType: PatrimonyItemType;
  category: PatrimonyCategory;
  purchaseValue: number;
  appreciation: number;
  depreciation: number;
  debtValue: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudget {
  id: string;
  categoryId: string;
  month: number;
  year: number;
  plannedAmount: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface FinanceState {
  transactions: Transaction[];
  categories: Category[];
  investments: Investment[];
  patrimonyItems: PatrimonyItem[];
  monthlyBudgets: MonthlyBudget[];
}
