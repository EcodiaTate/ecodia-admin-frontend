import api from './client'
import type { Transaction, FinanceSummary } from '@/types/finance'

export async function getTransactions(params?: { limit?: number; offset?: number; status?: string; clientId?: string }) {
  const { data } = await api.get<{ transactions: Transaction[]; total: number }>('/finance/transactions', { params })
  return data
}

export async function getFinanceSummary() {
  const { data } = await api.get<FinanceSummary>('/finance/summary')
  return data
}

export async function syncFinance() {
  const { data } = await api.post('/finance/sync')
  return data
}

export async function updateCategory(id: string, category: string, xeroCategory?: string) {
  const { data } = await api.patch<Transaction>(`/finance/transactions/${id}/category`, { category, xeroCategory })
  return data
}
