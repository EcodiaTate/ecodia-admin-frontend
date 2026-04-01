import { useQuery } from '@tanstack/react-query'
import { getSessions } from '@/api/claudeCode'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import type { CCSession } from '@/types/claudeCode'

interface SessionListProps {
  onSelect: (session: CCSession) => void
}

export function SessionList({ onSelect }: SessionListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['ccSessions'],
    queryFn: () => getSessions({ limit: 20 }),
  })

  if (isLoading) return <LoadingSpinner />

  const columns = [
    { key: 'status', header: 'Status', render: (r: CCSession) => <StatusBadge status={r.status} />, className: 'w-28' },
    { key: 'initial_prompt', header: 'Prompt', render: (r: CCSession) => <span className="line-clamp-1">{r.initial_prompt}</span> },
    { key: 'project_name', header: 'Project', render: (r: CCSession) => r.project_name || '-' },
    { key: 'triggered_by', header: 'Trigger' },
    { key: 'started_at', header: 'Started', render: (r: CCSession) => formatRelative(r.started_at) },
    { key: 'cc_cost_usd', header: 'Cost', render: (r: CCSession) => r.cc_cost_usd ? `$${r.cc_cost_usd.toFixed(4)}` : '-' },
  ]

  return <DataTable columns={columns} data={data?.sessions ?? []} onRowClick={onSelect} />
}
