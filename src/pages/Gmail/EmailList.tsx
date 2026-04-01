import { useQuery } from '@tanstack/react-query'
import { getThreads } from '@/api/gmail'
import { DataTable } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import type { EmailThread } from '@/types/gmail'

interface EmailListProps {
  status?: string
  onSelect: (thread: EmailThread) => void
}

export function EmailList({ status, onSelect }: EmailListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['gmailThreads', status],
    queryFn: () => getThreads({ status, limit: 20 }),
  })

  if (isLoading) return <LoadingSpinner />

  const columns = [
    { key: 'triage_priority', header: '', render: (r: EmailThread) => <StatusBadge status={r.triage_priority} />, className: 'w-20' },
    { key: 'from_name', header: 'From', render: (r: EmailThread) => r.from_name || r.from_email },
    { key: 'subject', header: 'Subject', render: (r: EmailThread) => r.subject || '(no subject)' },
    { key: 'triage_summary', header: 'Summary', render: (r: EmailThread) => r.triage_summary || '-' },
    { key: 'status', header: 'Status', render: (r: EmailThread) => <StatusBadge status={r.status} /> },
    { key: 'received_at', header: 'Received', render: (r: EmailThread) => r.received_at ? formatRelative(r.received_at) : '-' },
  ]

  return <DataTable columns={columns} data={data?.threads ?? []} onRowClick={(r) => onSelect(r as unknown as EmailThread)} />
}
