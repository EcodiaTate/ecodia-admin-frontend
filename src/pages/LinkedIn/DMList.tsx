import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDMs } from '@/api/linkedin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LinkedInDM, DMCategory } from '@/types/linkedin'
import { Target, Search } from 'lucide-react'

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
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category pills */}
        {CATEGORIES.map((c) => (
          <button
            key={c.label}
            onClick={() => setCategory(c.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              category === c.value
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
            )}
          >
            {c.label}
          </button>
        ))}

        <div className="mx-2 h-4 w-px bg-zinc-800" />

        {STATUS_FILTERS.map((s) => (
          <button
            key={s.label}
            onClick={() => setStatus(s.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              status === s.value
                ? 'bg-zinc-700 text-zinc-100'
                : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-200'
            )}
          >
            {s.label}
          </button>
        ))}

        {/* Search */}
        <div className="ml-auto flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm text-zinc-300 placeholder-zinc-500 outline-none"
          />
        </div>
      </div>

      {/* DM List */}
      <div className="space-y-1">
        {(data?.dms ?? []).map((dm: LinkedInDM) => (
          <button
            key={dm.id}
            onClick={() => onSelect(dm)}
            className={cn(
              'flex w-full items-center gap-4 rounded-lg border border-zinc-800/50 px-4 py-3 text-left transition-colors hover:bg-zinc-800/50',
              dm.status === 'unread' && 'border-zinc-700 bg-zinc-900/80'
            )}
          >
            {/* Priority dot */}
            <div className={cn(
              'h-2 w-2 shrink-0 rounded-full',
              dm.priority === 'urgent' ? 'bg-red-400' :
              dm.priority === 'high' ? 'bg-orange-400' :
              dm.priority === 'normal' ? 'bg-zinc-600' : 'bg-zinc-700'
            )} />

            {/* Name + headline */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-medium', dm.status === 'unread' ? 'text-zinc-100' : 'text-zinc-300')}>
                  {dm.participant_name}
                </span>
                {dm.participant_headline && (
                  <span className="truncate text-xs text-zinc-500">{dm.participant_headline}</span>
                )}
              </div>
              {dm.triage_summary && (
                <p className="mt-0.5 truncate text-xs text-zinc-400">{dm.triage_summary}</p>
              )}
            </div>

            {/* Lead score */}
            {dm.lead_score != null && dm.lead_score > 0 && (
              <div className="flex items-center gap-1" title={`Lead score: ${Math.round(dm.lead_score * 100)}%`}>
                <Target className="h-3 w-3 text-emerald-400" />
                <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${dm.lead_score * 100}%` }} />
                </div>
              </div>
            )}

            {/* Category + status badges */}
            <div className="flex shrink-0 items-center gap-2">
              {dm.category !== 'uncategorized' && <StatusBadge status={dm.category} />}
              <StatusBadge status={dm.status} />
            </div>

            {/* Time */}
            <span className="shrink-0 text-xs text-zinc-500">
              {dm.last_message_at ? formatRelative(dm.last_message_at) : '-'}
            </span>
          </button>
        ))}

        {(data?.dms ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">No DMs found</p>
        )}
      </div>
    </div>
  )
}
