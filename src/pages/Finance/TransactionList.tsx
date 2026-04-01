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
    { key: 'date', header: 'Date', render: (r: Transaction) => formatDate(r.date) },
    { key: 'description', header: 'Description' },
    {
      key: 'amount_aud',
      header: 'Amount',
      render: (r: Transaction) => (
        <span className={r.type === 'credit' ? 'text-green-400' : 'text-red-400'}>
          {formatCurrency(r.amount_aud)}
        </span>
      ),
    },
    { key: 'category', header: 'Category', render: (r: Transaction) => r.category || '-' },
    { key: 'status', header: 'Status', render: (r: Transaction) => <StatusBadge status={r.status} /> },
  ]

  return <DataTable columns={columns} data={data?.transactions ?? []} />
}
