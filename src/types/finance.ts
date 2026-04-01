export interface Transaction {
  id: string
  xero_id: string
  bank_account_id: string
  date: string
  description: string
  amount_aud: number
  type: 'debit' | 'credit'
  status: 'uncategorized' | 'categorized' | 'reconciled'
  category: string | null
  category_confidence: number | null
  xero_category: string | null
  client_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
}

export interface FinanceSummary {
  income: number
  expenses: number
  net: number
  categories: { category: string; total: number; count: number }[]
}
