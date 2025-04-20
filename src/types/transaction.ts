/**
 * Transaction interface for storing transaction data
 */
export interface Transaction {
  id: string;
  amount: number;
  date: string; // ISO string
  description: string;
  category?: string;
  type: 'credit' | 'debit';
  balance?: number;
  bank?: string;
  merchant?: string;
  originalSMS?: string;
  notes?: string;
  isHidden?: boolean;
  isRecurring?: boolean;
}

/**
 * TransactionFilter interface for filtering transactions
 */
export interface TransactionFilter {
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  type?: 'credit' | 'debit';
  bank?: string;
  search?: string;
}

/**
 * CategoryTotal interface for storing category-wise totals
 */
export interface CategoryTotal {
  category: string;
  total: number;
  count: number;
  percentage: number;
  color: string;
}

export interface BankPattern {
  regex: RegExp;
  extract: (matches: RegExpMatchArray) => Transaction;
} 