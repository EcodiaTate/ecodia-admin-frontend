import { useQuery } from '@tanstack/react-query'
import { getDMs } from '@/api/linkedin'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'

interface DMListProps {
  onSelect: (dm: Record<string, unknown>) => void
}

export function DMList({ onSelect }: DMListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['linkedinDMs'],
    queryFn: () => getDMs({ limit: 15 }),
  })

  if (isLoading) return <LoadingSpinner />

  const columns = [
    { key: 'participant_name', header: 'From' },
    { key: 'status', header: 'Status', render: (r: Record<string, unknown>) => <StatusBadge status={r.status as string} /> },
    { key: 'last_message_at', header: 'Last Message', render: (r: Record<string, unknown>) => r.last_message_at ? formatRelative(r.last_message_at as string) : '-' },
  ]

  return <DataTable columns={columns} data={data?.dms ?? []} onRowClick={onSelect} />
}
