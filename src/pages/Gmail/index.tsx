import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { syncGmail, getGmailStats } from '@/api/gmail'
import { EmailList } from './EmailList'
import { EmailDetail } from './EmailDetail'
import { DraftReview } from './DraftReview'
import type { EmailThread } from '@/types/gmail'
import toast from 'react-hot-toast'
import { RefreshCw, Mail, AlertTriangle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type Filter = {
  status?: string
  priority?: string
  inbox?: string
}

export default function GmailPage() {
  const [selected, setSelected] = useState<EmailThread | null>(null)
  const [filter, setFilter] = useState<Filter>({})
  const queryClient = useQueryClient()

  const { data: stats } = useQuery({ queryKey: ['gmailStats'], queryFn: getGmailStats })

  const sync = useMutation({
    mutationFn: syncGmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      queryClient.invalidateQueries({ queryKey: ['gmailStats'] })
      toast.success('Synced & triaged')
    },
    onError: (e) => toast.error(`Sync failed: ${(e as Error).message}`),
  })

  const statCards = [
    { label: 'Unread', value: stats?.unread ?? 0, icon: Mail, color: 'text-yellow-400', onClick: () => setFilter({ status: 'unread' }) },
    { label: 'Urgent', value: stats?.urgent ?? 0, icon: AlertTriangle, color: 'text-red-400', onClick: () => setFilter({ priority: 'urgent' }) },
    { label: 'High', value: stats?.high ?? 0, icon: AlertCircle, color: 'text-orange-400', onClick: () => setFilter({ priority: 'high' }) },
  ]

  const inboxTabs = [
    { label: 'All', value: undefined },
    { label: 'code@', value: 'code@ecodia.au' },
    { label: 'tate@', value: 'tate@ecodia.au' },
  ]

  if (selected) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => { setSelected(null); queryClient.invalidateQueries({ queryKey: ['gmailThreads'] }) }}
          className="text-sm text-zinc-400 hover:text-zinc-200"
        >
          &larr; Back to inbox
        </button>
        <EmailDetail thread={selected} onUpdate={(t) => setSelected(t)} />
        <DraftReview thread={selected} onUpdate={(t) => setSelected(t)} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-100">Email Command Center</h1>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="flex items-center gap-2 rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', sync.isPending && 'animate-spin')} />
          Sync All
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={card.onClick}
            className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 text-left transition-colors hover:bg-zinc-800/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{card.label}</span>
              <card.icon className={cn('h-4 w-4', card.color)} />
            </div>
            <p className={cn('mt-1 text-2xl font-semibold', card.color)}>{card.value}</p>
          </button>
        ))}
      </div>

      {/* Inbox tabs */}
      <div className="flex items-center gap-2">
        {inboxTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilter(f => ({ ...f, inbox: tab.value }))}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              filter.inbox === tab.value ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {tab.label}
          </button>
        ))}

        <div className="mx-2 h-4 w-px bg-zinc-800" />

        {['all', 'unread', 'triaged', 'replied'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, status: s === 'all' ? undefined : s }))}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm',
              (s === 'all' && !filter.status) || filter.status === s
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        {(filter.status || filter.priority || filter.inbox) && (
          <button
            onClick={() => setFilter({})}
            className="ml-2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            Clear filters
          </button>
        )}
      </div>

      <EmailList
        status={filter.status}
        priority={filter.priority}
        inbox={filter.inbox}
        onSelect={setSelected}
      />
    </div>
  )
}
