import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDMs } from '@/api/linkedin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LinkedInDM, DMCategory } from '@/types/linkedin'
import { Target, Search } from 'lucide-react'
import { motion } from 'framer-motion'

interface DMListProps {
  onSelect: (dm: LinkedInDM) => void
}

const CATEGORIES: { label: string; value: DMCategory | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Leads', value: 'lead' },
  { label: 'Networking', value: 'networking' },
  { label: 'Recruiter', value: 'recruiter' },
  { label: 'Support', value: 'support' },
  { label: 'Personal', value: 'personal' },
  { label: 'Spam', value: 'spam' },
]

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Unread', value: 'unread' },
  { label: 'Drafting', value: 'drafting' },
  { label: 'Replied', value: 'replied' },
]

export function DMList({ onSelect }: DMListProps) {
  const [category, setCategory] = useState<DMCategory | undefined>()
  const [status, setStatus] = useState<string | undefined>()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['linkedinDMs', { category, status, search }],
    queryFn: () => getDMs({ limit: 30, category, status, search: search || undefined }),
  })

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.label}
            onClick={() => setCategory(c.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              category === c.value
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {c.label}
          </button>
        ))}

        <div className="mx-2 h-4 w-px bg-surface-container" />

        {STATUS_FILTERS.map((s) => (
          <button
            key={s.label}
            onClick={() => setStatus(s.value)}
            className={cn(
              'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              status === s.value
                ? 'bg-primary/10 text-primary'
                : 'text-on-surface-muted hover:bg-surface-container-low hover:text-on-surface-variant',
            )}
          >
            {s.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2">
          <Search className="h-3.5 w-3.5 text-on-surface-muted" strokeWidth={1.75} />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-on-surface placeholder-on-surface-muted outline-none"
          />
        </div>
      </div>

      {/* DM List */}
      <div className="space-y-1">
        {(data?.dms ?? []).map((dm: LinkedInDM, i: number) => (
          <motion.button
            key={dm.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.03 }}
            onClick={() => onSelect(dm)}
            className={cn(
              'flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-colors hover:bg-surface-container-low/60',
              dm.status === 'unread' && 'bg-surface-container-low/30',
            )}
          >
            {/* Priority dot */}
            <div className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              dm.priority === 'urgent' ? 'bg-error' :
              dm.priority === 'high' ? 'bg-tertiary' :
              'bg-surface-container',
            )} />

            {/* Name + headline */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', dm.status === 'unread' ? 'text-on-surface' : 'text-on-surface-variant')}>
                  {dm.participant_name}
                </span>
                {dm.participant_headline && (
                  <span className="truncate text-xs text-on-surface-muted">{dm.participant_headline}</span>
                )}
              </div>
              {dm.triage_summary && (
                <p className="mt-0.5 truncate text-xs text-on-surface-muted">{dm.triage_summary}</p>
              )}
            </div>

            {/* Lead score */}
            {dm.lead_score != null && dm.lead_score > 0 && (
              <div className="flex items-center gap-1.5" title={`Lead score: ${Math.round(dm.lead_score * 100)}%`}>
                <Target className="h-3 w-3 text-secondary" strokeWidth={1.75} />
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-surface-container">
                  <div className="h-full rounded-full bg-secondary" style={{ width: `${dm.lead_score * 100}%` }} />
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="flex shrink-0 items-center gap-2">
              {dm.category !== 'uncategorized' && <StatusBadge status={dm.category} />}
              <StatusBadge status={dm.status} />
            </div>

            {/* Time */}
            <span className="shrink-0 font-mono text-label-sm text-on-surface-muted">
              {dm.last_message_at ? formatRelative(dm.last_message_at) : '\u2014'}
            </span>
          </motion.button>
        ))}

        {(data?.dms ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-on-surface-muted">No conversations match filters</p>
        )}
      </div>
    </div>
  )
}
