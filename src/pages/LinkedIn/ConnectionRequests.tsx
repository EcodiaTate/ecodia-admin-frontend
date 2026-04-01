import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConnectionRequests, acceptConnection, declineConnection, batchConnectionAction } from '@/api/linkedin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { ConnectionRequest } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { Check, X, Users, Building2, CheckSquare, Square } from 'lucide-react'
import { motion } from 'framer-motion'

export function ConnectionRequests() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const queryClient = useQueryClient()

  const { data: requests, isLoading } = useQuery({
    queryKey: ['linkedinConnectionRequests'],
    queryFn: () => getConnectionRequests({ status: 'pending' }),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['linkedinConnectionRequests'] })
    queryClient.invalidateQueries({ queryKey: ['linkedinWorkerStatus'] })
  }

  const accept = useMutation({
    mutationFn: acceptConnection,
    onSuccess: () => { invalidate(); toast.success('Connection accepted') },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  })

  const decline = useMutation({
    mutationFn: declineConnection,
    onSuccess: () => { invalidate(); toast.success('Connection declined') },
    onError: (e) => toast.error(`Failed: ${(e as Error).message}`),
  })

  const batchAction = useMutation({
    mutationFn: ({ ids, action }: { ids: string[]; action: 'accept' | 'decline' }) =>
      batchConnectionAction(ids, action),
    onSuccess: () => { invalidate(); setSelected(new Set()); toast.success('Batch action complete') },
  })

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const toggleAll = () => {
    if (selected.size === (requests?.length ?? 0)) setSelected(new Set())
    else setSelected(new Set(requests?.map(r => r.id) ?? []))
  }

  if (isLoading) return <LoadingSpinner />

  const getRelevanceColor = (score: number | null) => {
    if (score == null) return 'text-on-surface-muted'
    if (score >= 0.7) return 'text-secondary'
    if (score >= 0.4) return 'text-tertiary'
    return 'text-on-surface-muted'
  }

  return (
    <div className="space-y-6">
      {/* Batch toolbar */}
      {selected.size > 0 && (
        <div className="glass-elevated flex items-center gap-3 rounded-2xl p-4">
          <span className="text-sm text-on-surface-muted">{selected.size} selected</span>
          <button
            onClick={() => batchAction.mutate({ ids: [...selected], action: 'accept' })}
            disabled={batchAction.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-secondary/10 px-3 py-2 text-sm text-secondary transition-colors hover:bg-secondary/20"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={1.75} /> Accept All
          </button>
          <button
            onClick={() => batchAction.mutate({ ids: [...selected], action: 'decline' })}
            disabled={batchAction.isPending}
            className="flex items-center gap-1.5 rounded-xl bg-error/10 px-3 py-2 text-sm text-error transition-colors hover:bg-error/20"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.75} /> Decline All
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-on-surface-muted hover:text-on-surface-variant">Clear</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={toggleAll} className="text-on-surface-muted transition-colors hover:text-on-surface-variant">
          {selected.size === (requests?.length ?? 0) ? <CheckSquare className="h-4 w-4" strokeWidth={1.75} /> : <Square className="h-4 w-4" strokeWidth={1.75} />}
        </button>
        <span className="text-sm text-on-surface-muted">{requests?.length ?? 0} pending requests</span>
      </div>

      {/* Request list */}
      <div className="space-y-2">
        {(requests ?? []).map((req: ConnectionRequest, i: number) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i * 0.03 }}
            className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-colors hover:bg-surface-container-low/60"
          >
            <button onClick={() => toggleSelect(req.id)} className="text-on-surface-muted transition-colors hover:text-on-surface-variant">
              {selected.has(req.id) ? <CheckSquare className="h-4 w-4 text-primary" strokeWidth={1.75} /> : <Square className="h-4 w-4" strokeWidth={1.75} />}
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-on-surface">{req.name}</span>
                {req.relevance_score != null && (
                  <span className={cn('text-xs font-medium', getRelevanceColor(req.relevance_score))}>
                    {Math.round(req.relevance_score * 100)}% relevant
                  </span>
                )}
              </div>
              {(req.headline || req.profile_headline) && (
                <p className="text-xs text-on-surface-muted">{req.headline || req.profile_headline}</p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-muted">
                {req.profile_company && (
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" strokeWidth={1.75} />{req.profile_company}</span>
                )}
                {req.profile_mutual != null && req.profile_mutual > 0 && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" strokeWidth={1.75} />{req.profile_mutual} mutual</span>
                )}
              </div>
              {req.message && (
                <p className="mt-1 text-xs italic text-on-surface-muted">"{req.message}"</p>
              )}
              {req.relevance_reason && (
                <p className="mt-1 text-label-sm text-on-surface-muted">{req.relevance_reason}</p>
              )}
            </div>

            {req.relevance_score != null && (
              <div className="w-16">
                <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
                  <div
                    className={cn('h-full rounded-full',
                      req.relevance_score >= 0.7 ? 'bg-secondary' :
                      req.relevance_score >= 0.4 ? 'bg-tertiary' : 'bg-on-surface-muted/30',
                    )}
                    style={{ width: `${req.relevance_score * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() => accept.mutate(req.id)}
                disabled={accept.isPending}
                className="rounded-xl bg-secondary/10 p-2.5 text-secondary transition-colors hover:bg-secondary/20"
                title="Accept"
              >
                <Check className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <button
                onClick={() => decline.mutate(req.id)}
                disabled={decline.isPending}
                className="rounded-xl bg-error/10 p-2.5 text-error transition-colors hover:bg-error/20"
                title="Decline"
              >
                <X className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </motion.div>
        ))}

        {(requests ?? []).length === 0 && (
          <p className="py-16 text-center text-sm text-on-surface-muted">No pending connection requests</p>
        )}
      </div>
    </div>
  )
}
