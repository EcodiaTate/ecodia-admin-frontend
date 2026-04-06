import client from './client'

// ── Staged Transactions ──
export const getStagedCounts = () => client.get('/bookkeeping/staged/counts').then(r => r.data)
export const getStaged = (status?: string) =>
  client.get('/bookkeeping/staged', { params: status ? { status } : {} }).then(r => r.data)
export const getStagedById = (id: string) => client.get(`/bookkeeping/staged/${id}`).then(r => r.data)
export const updateStaged = (id: string, data: any) =>
  client.patch(`/bookkeeping/staged/${id}`, data).then(r => r.data)
export const postStaged = (id: string) =>
  client.post(`/bookkeeping/staged/${id}/post`).then(r => r.data)
export const batchPost = () => client.post('/bookkeeping/staged/batch-post').then(r => r.data)
export const ignoreStaged = (id: string) =>
  client.post(`/bookkeeping/staged/${id}/ignore`).then(r => r.data)
export const discardStaged = (id: string, learn = false) =>
  client.post(`/bookkeeping/staged/${id}/discard${learn ? '?learn=true' : ''}`).then(r => r.data)

// ── Ingest ──
export const uploadCSV = async (file: File, sourceAccount?: string) => {
  const text = await file.text()
  const qs = sourceAccount ? `?source_account=${sourceAccount}` : ''  // omit = auto-detect from CSV
  return client.post(`/bookkeeping/ingest/csv${qs}`, text, {
    headers: { 'Content-Type': 'text/plain' },
  }).then(r => r.data)
}
export const importXero = () => client.post('/bookkeeping/ingest/xero').then(r => r.data)
export const triggerCategorize = () => client.post('/bookkeeping/categorize').then(r => r.data)

// ── Ledger ──
export const getLedgerTransactions = (limit = 50) =>
  client.get('/bookkeeping/ledger/transactions', { params: { limit } }).then(r => r.data)
export const getTrialBalance = (asOf?: string) =>
  client.get('/bookkeeping/ledger/trial-balance', { params: asOf ? { as_of: asOf } : {} }).then(r => r.data)

// ── Reports ──
export const getBAS = (start: string, end: string) =>
  client.get('/bookkeeping/reports/bas', { params: { period_start: start, period_end: end } }).then(r => r.data)
export const getPnL = (start: string, end: string) =>
  client.get('/bookkeeping/reports/pnl', { params: { period_start: start, period_end: end } }).then(r => r.data)
export const getBalanceSheet = (asOf: string) =>
  client.get('/bookkeeping/reports/balance-sheet', { params: { as_of: asOf } }).then(r => r.data)
export const getExpenseBreakdown = (start: string, end: string) =>
  client.get('/bookkeeping/reports/expense-breakdown', { params: { period_start: start, period_end: end } }).then(r => r.data)
export const getGSTSummary = (start: string, end: string) =>
  client.get('/bookkeeping/reports/gst-summary', { params: { period_start: start, period_end: end } }).then(r => r.data)

// ── Director Loan ──
export const getDirectorLoanBalance = () =>
  client.get('/bookkeeping/director-loan/balance').then(r => r.data)

// ── Rules ──
export const getRules = () => client.get('/bookkeeping/rules').then(r => r.data)
export const createRule = (data: any) => client.post('/bookkeeping/rules', data).then(r => r.data)
export const deleteRule = (id: string) => client.delete(`/bookkeeping/rules/${id}`).then(r => r.data)

// ── Accounts ──
export const getAccounts = () => client.get('/bookkeeping/accounts').then(r => r.data)

// ── Helpers ──
export const cents = (c: number) => `$${(c / 100).toFixed(2)}`
