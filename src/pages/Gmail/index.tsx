import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getGmailStats } from '@/api/gmail'
import { EmailList } from './EmailList'
import { EmailDetail } from './EmailDetail'
import { DraftReview } from './DraftReview'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { EmailThread } from '@/types/gmail'
import type { WorkerStatus } from '@/store/workerStore'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { ArrowLeft, Mail, AlertTriangle, AlertCircle, X } from 'lucide-react'

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
  const gmailWorker = useWorkerStatus('gmail') as WorkerStatus | null

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
        transition={{ type: 'spring', stiffness: 100, damping: 22 }}
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
      <div className="mb-10 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Communication Stream
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Digital <em className="not-italic font-normal text-primary">Curator</em>
          </h1>
        </div>
        {gmailWorker && (
          <AmbientPulse label="Gmail" lastSyncAt={gmailWorker.lastSync} status={gmailWorker.status} />
        )}
      </div>

      {/* Whisper stats — tiny ambient counters that spring to life on hover */}
      <div className="mb-10 flex gap-12">
        <WhisperStat
          label="Unread"
          value={stats?.unread ?? 0}
          icon={Mail}
          accent="text-tertiary"
          onClick={() => setFilter({ status: 'unread' })}
        />
        <WhisperStat
          label="Urgent"
          value={stats?.urgent ?? 0}
          icon={AlertTriangle}
          accent="text-error"
          onClick={() => setFilter({ priority: 'urgent' })}
        />
        <WhisperStat
          label="High"
          value={stats?.high ?? 0}
          icon={AlertCircle}
          accent="text-tertiary"
          onClick={() => setFilter({ priority: 'high' })}
        />
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex items-center gap-1 flex-wrap">
        {inboxTabs.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setFilter(f => ({ ...f, inbox: tab.value }))}
            className={cn(
              'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              filter.inbox === tab.value
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {tab.label}
            {filter.inbox === tab.value && tab.value && (
              <button
                onClick={(e) => { e.stopPropagation(); setFilter(f => ({ ...f, inbox: undefined })) }}
                className="ml-1.5 inline-flex text-primary/50 hover:text-primary"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </button>
        ))}

        <div className="mx-3 h-4 w-px bg-surface-container" />

        {['all', 'unread', 'triaged', 'replied'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(f => ({ ...f, status: s === 'all' ? undefined : s }))}
            className={cn(
              'relative rounded-xl px-4 py-2 text-sm font-medium transition-colors',
              (s === 'all' && !filter.status) || filter.status === s
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {filter.status === s && s !== 'all' && (
              <button
                onClick={(e) => { e.stopPropagation(); setFilter(f => ({ ...f, status: undefined })) }}
                className="ml-1.5 inline-flex text-primary/50 hover:text-primary"
              >
                <X className="h-3 w-3" strokeWidth={2} />
              </button>
            )}
          </button>
        ))}
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
