import { useQuery } from '@tanstack/react-query'
import { getTransactions } from '@/api/finance'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatCurrency, formatDate } from '@/lib/utils'

import type { Transaction } from '@/types/finance'

export function TransactionList({ status }: { status?: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['transactions', status],
    queryFn: () => getTransactions({ status, limit: 50 }),
  })

  if (isLoading) return <LoadingSpinner />

  const columns = [
    {
      key: 'date',
      header: 'Date',
      render: (r: Transaction) => (
        <span className="font-mono text-label-sm text-on-surface-muted">{formatDate(r.date)}</span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (r: Transaction) => (
        <span className="text-on-surface">{r.description}</span>
      ),
    },
    {
      key: 'amount_aud',
      header: 'Amount',
      render: (r: Transaction) => (
        <span className={`font-mono font-medium ${r.type === 'credit' ? 'text-secondary' : 'text-on-surface-variant'}`}>
          {r.type === 'credit' ? '+' : ''}{formatCurrency(r.amount_aud)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (r: Transaction) => (
        <span className="text-on-surface-muted">{r.category || '\u2014'}</span>
      ),
    },
    { key: 'status', header: 'Status', render: (r: Transaction) => <StatusBadge status={r.status} /> },
  ]

  return <DataTable columns={columns} data={data?.transactions ?? []} />
}
