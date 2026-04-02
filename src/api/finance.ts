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
