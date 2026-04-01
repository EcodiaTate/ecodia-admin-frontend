import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getConnectionRequests, acceptConnection, declineConnection, batchConnectionAction } from '@/api/linkedin'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { cn } from '@/lib/utils'
import type { ConnectionRequest } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { Check, X, Users, Building2, CheckSquare, Square } from 'lucide-react'

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
    if (score == null) return 'text-zinc-500'
    if (score >= 0.7) return 'text-emerald-400'
    if (score >= 0.4) return 'text-yellow-400'
    return 'text-zinc-500'
  }

  return (
    <div className="space-y-4">
      {/* Batch toolbar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/80 p-3">
          <span className="text-sm text-zinc-400">{selected.size} selected</span>
          <button
            onClick={() => batchAction.mutate({ ids: [...selected], action: 'accept' })}
            disabled={batchAction.isPending}
            className="flex items-center gap-1 rounded-md bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-600/30"
          >
            <Check className="h-3.5 w-3.5" /> Accept All
          </button>
          <button
            onClick={() => batchAction.mutate({ ids: [...selected], action: 'decline' })}
            disabled={batchAction.isPending}
            className="flex items-center gap-1 rounded-md bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
          >
            <X className="h-3.5 w-3.5" /> Decline All
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-zinc-500 hover:text-zinc-300">Clear</button>
        </div>
      )}

      {/* Header with select all */}
      <div className="flex items-center gap-2">
        <button onClick={toggleAll} className="text-zinc-500 hover:text-zinc-300">
          {selected.size === (requests?.length ?? 0) ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        </button>
        <span className="text-sm text-zinc-400">{requests?.length ?? 0} pending requests</span>
      </div>

      {/* Request list */}
      <div className="space-y-2">
        {(requests ?? []).map((req: ConnectionRequest) => (
          <div key={req.id} className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            {/* Checkbox */}
            <button onClick={() => toggleSelect(req.id)} className="text-zinc-500 hover:text-zinc-300">
              {selected.has(req.id) ? <CheckSquare className="h-4 w-4 text-blue-400" /> : <Square className="h-4 w-4" />}
            </button>

            {/* Profile info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-zinc-200">{req.name}</span>
                {req.relevance_score != null && (
                  <span className={cn('text-xs font-medium', getRelevanceColor(req.relevance_score))}>
                    {Math.round(req.relevance_score * 100)}% relevant
                  </span>
                )}
              </div>
              {(req.headline || req.profile_headline) && (
                <p className="text-xs text-zinc-400">{req.headline || req.profile_headline}</p>
              )}
              <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500">
                {(req.profile_company) && (
                  <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{req.profile_company}</span>
                )}
                {req.profile_mutual != null && req.profile_mutual > 0 && (
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{req.profile_mutual} mutual</span>
                )}
              </div>
              {req.message && (
                <p className="mt-1 text-xs text-zinc-400 italic">"{req.message}"</p>
              )}
              {req.relevance_reason && (
                <p className="mt-1 text-[10px] text-zinc-500">{req.relevance_reason}</p>
              )}
            </div>

            {/* Relevance bar */}
            {req.relevance_score != null && (
              <div className="w-16">
                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className={cn('h-full rounded-full',
                      req.relevance_score >= 0.7 ? 'bg-emerald-400' :
                      req.relevance_score >= 0.4 ? 'bg-yellow-400' : 'bg-zinc-600'
                    )}
                    style={{ width: `${req.relevance_score * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() => accept.mutate(req.id)}
                disabled={accept.isPending}
                className="rounded-md bg-emerald-600/20 p-2 text-emerald-400 hover:bg-emerald-600/30"
                title="Accept"
              >
                <Check className="h-4 w-4" />
              </button>
              <button
                onClick={() => decline.mutate(req.id)}
                disabled={decline.isPending}
                className="rounded-md bg-red-600/20 p-2 text-red-400 hover:bg-red-600/30"
                title="Decline"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {(requests ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">No pending connection requests</p>
        )}
      </div>
    </div>
  )
}
