import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { syncGmail, getGmailStats } from '@/api/gmail'
import { EmailList } from './EmailList'
import { EmailDetail } from './EmailDetail'
import { DraftReview } from './DraftReview'
import type { EmailThread } from '@/types/gmail'
import toast from 'react-hot-toast'
import { RefreshCw, Mail, AlertTriangle, AlertCircle, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

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
    { label: 'Unread', value: stats?.unread ?? 0, icon: Mail, accent: 'text-tertiary', onClick: () => setFilter({ status: 'unread' }) },
    { label: 'Urgent', value: stats?.urgent ?? 0, icon: AlertTriangle, accent: 'text-error', onClick: () => setFilter({ priority: 'urgent' }) },
    { label: 'High', value: stats?.high ?? 0, icon: AlertCircle, accent: 'text-tertiary', onClick: () => setFilter({ priority: 'high' }) },
  ]

  const inboxTabs = [
    { label: 'All', value: undefined },
    { label: 'code@', value: 'code@ecodia.au' },
    { label: 'tate@', value: 'tate@ecodia.au' },
  ]

  if (selected) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="max-w-4xl space-y-8"
      >
        <button
          onClick={() => { setSelected(null); queryClient.invalidateQueries({ queryKey: ['gmailThreads'] }) }}
          className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
          Back to inbox
        </button>
        <EmailDetail thread={selected} onUpdate={(t) => setSelected(t)} />
        <DraftReview thread={selected} onUpdate={(t) => setSelected(t)} />
      </motion.div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-12 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Communication Stream
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Digital <em className="not-italic font-normal text-primary">Curator</em>
          </h1>
        </div>
        <button
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm font-medium text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', sync.isPending && 'animate-spin')} strokeWidth={1.75} />
          Sync All
        </button>
      </div>

      {/* Stat cards */}
      <div className="mb-12 grid grid-cols-3 gap-6">
        {statCards.map((card, i) => (
          <motion.button
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.06 }}
            onClick={card.onClick}
            className="glass rounded-3xl p-8 text-left transition-all hover:shadow-glass-hover"
          >
            <div className="flex items-center justify-between">
              <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">{card.label}</span>
              <card.icon className={cn('h-4 w-4', card.accent)} strokeWidth={1.75} />
            </div>
            <p className={cn('mt-4 font-display text-[1.75rem] font-light', card.accent)}>{card.value}</p>
          </motion.button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 flex-wrap">
        {inboxTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilter(f => ({ ...f, inbox: tab.value }))}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              filter.inbox === tab.value
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {tab.label}
          </button>
        ))}

        <div className="mx-3 h-4 w-px bg-surface-container" />

        {['all', 'unread', 'triaged', 'replied'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, status: s === 'all' ? undefined : s }))}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              (s === 'all' && !filter.status) || filter.status === s
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}

        {(filter.status || filter.priority || filter.inbox) && (
          <button
            onClick={() => setFilter({})}
            className="ml-2 text-xs text-on-surface-muted transition-colors hover:text-on-surface-variant"
          >
            Clear
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
