import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getDM, triageDM, draftDMReply, sendDM, updateDM, analyzeDMLead } from '@/api/linkedin'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { formatRelative } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LeadAnalysis } from '@/types/linkedin'
import toast from 'react-hot-toast'
import { useState } from 'react'
import { Sparkles, Send, Target, UserPlus, Archive, Building2, MapPin, Users } from 'lucide-react'

export function DMDetail({ dmId }: { dmId: string }) {
  const queryClient = useQueryClient()
  const [leadAnalysis, setLeadAnalysis] = useState<LeadAnalysis | null>(null)

  const { data: dm, isLoading } = useQuery({
    queryKey: ['linkedinDM', dmId],
    queryFn: () => getDM(dmId),
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['linkedinDMs'] })
    queryClient.invalidateQueries({ queryKey: ['linkedinDMStats'] })
    queryClient.invalidateQueries({ queryKey: ['linkedinDM', dmId] })
  }

  const triage = useMutation({
    mutationFn: () => triageDM(dmId),
    onSuccess: () => { invalidate(); toast.success('Triaged') },
    onError: () => toast.error('Triage failed'),
  })

  const draft = useMutation({
    mutationFn: () => draftDMReply(dmId),
    onSuccess: () => { invalidate(); toast.success('Draft generated') },
    onError: () => toast.error('Draft failed'),
  })

  const send = useMutation({
    mutationFn: () => sendDM(dmId),
    onSuccess: () => { invalidate(); toast.success('Reply sent via LinkedIn') },
    onError: (e) => toast.error(`Send failed: ${(e as Error).message}`),
  })

  const ignore = useMutation({
    mutationFn: () => updateDM(dmId, { status: 'ignored' }),
    onSuccess: () => { invalidate(); toast.success('Ignored') },
  })

  const analyzeLead = useMutation({
    mutationFn: () => analyzeDMLead(dmId),
    onSuccess: (data) => { setLeadAnalysis(data); toast.success('Lead analysis complete') },
    onError: () => toast.error('Lead analysis failed'),
  })

  if (isLoading || !dm) return <LoadingSpinner />

  const messages = (dm.messages as Array<{ sender: string; text: string; timestamp: string | null }>) || []

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Left panel: Messages */}
      <div className="col-span-2 space-y-4">
        {/* Conversation header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-zinc-100">{dm.participant_name}</h2>
            {dm.participant_headline && <p className="text-sm text-zinc-400">{dm.participant_headline}</p>}
          </div>
          <div className="flex items-center gap-2">
            {dm.category !== 'uncategorized' && <StatusBadge status={dm.category} />}
            <StatusBadge status={dm.priority} />
            <StatusBadge status={dm.status} />
          </div>
        </div>

        {/* Triage summary */}
        {dm.triage_summary && (
          <div className="rounded-md border border-zinc-700/50 bg-zinc-800/50 p-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">AI Triage</span>
            </div>
            <p className="mt-1 text-sm text-zinc-300">{dm.triage_summary}</p>
          </div>
        )}

        {/* Messages */}
        <div className="max-h-[500px] space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
          {messages.map((msg, i) => {
            const isMe = msg.sender.toLowerCase().includes('tate') || msg.sender === 'You'
            return (
              <div key={i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-lg px-3 py-2',
                  isMe ? 'bg-blue-900/40 text-blue-100' : 'bg-zinc-800/80 text-zinc-300'
                )}>
                  <p className="text-xs font-medium text-zinc-500">{msg.sender}</p>
                  <p className="mt-0.5 text-sm">{msg.text}</p>
                  {msg.timestamp && <p className="mt-1 text-[10px] text-zinc-600">{formatRelative(msg.timestamp)}</p>}
                </div>
              </div>
            )
          })}
          {messages.length === 0 && <p className="py-4 text-center text-sm text-zinc-500">No messages scraped</p>}
        </div>

        {/* Draft reply */}
        {dm.draft_reply && (
          <div className="rounded-lg border border-zinc-700/50 bg-zinc-900/80 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-400">Draft Reply</span>
              <button
                onClick={() => send.mutate()}
                disabled={send.isPending}
                className="flex items-center gap-1.5 rounded-md bg-blue-600/20 px-3 py-1.5 text-sm text-blue-400 hover:bg-blue-600/30 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                {send.isPending ? 'Sending...' : 'Send via LinkedIn'}
              </button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-300">{dm.draft_reply}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {dm.triage_status !== 'complete' && (
            <button onClick={() => triage.mutate()} disabled={triage.isPending}
              className="flex items-center gap-1.5 rounded-md bg-purple-600/20 px-3 py-1.5 text-sm text-purple-400 hover:bg-purple-600/30 disabled:opacity-50">
              <Sparkles className="h-3.5 w-3.5" /> {triage.isPending ? 'Triaging...' : 'AI Triage'}
            </button>
          )}
          <button onClick={() => draft.mutate()} disabled={draft.isPending}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50">
            <Sparkles className="h-3.5 w-3.5" /> {draft.isPending ? 'Drafting...' : 'Draft Reply'}
          </button>
          <button onClick={() => ignore.mutate()} disabled={ignore.isPending}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-700">
            <Archive className="h-3.5 w-3.5" /> Ignore
          </button>
          <button onClick={() => analyzeLead.mutate()} disabled={analyzeLead.isPending}
            className="flex items-center gap-1.5 rounded-md bg-emerald-600/20 px-3 py-1.5 text-sm text-emerald-400 hover:bg-emerald-600/30 disabled:opacity-50">
            <Target className="h-3.5 w-3.5" /> {analyzeLead.isPending ? 'Analyzing...' : 'Analyze Lead'}
          </button>
        </div>
      </div>

      {/* Right sidebar: Profile + Lead info */}
      <div className="space-y-4">
        {/* Profile card */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
          <h3 className="text-sm font-medium text-zinc-400">Profile</h3>
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-zinc-200">{dm.participant_name}</p>
            {(dm.profile_headline || dm.participant_headline) && (
              <p className="text-xs text-zinc-400">{dm.profile_headline || dm.participant_headline}</p>
            )}
            {(dm.profile_company || dm.participant_company) && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Building2 className="h-3 w-3" />
                {dm.profile_company || dm.participant_company}
              </div>
            )}
            {dm.profile_location && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <MapPin className="h-3 w-3" />
                {dm.profile_location}
              </div>
            )}
            {dm.profile_connection_degree && (
              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                <Users className="h-3 w-3" />
                {dm.profile_connection_degree} connection
                {dm.profile_mutual_connections ? ` · ${dm.profile_mutual_connections} mutual` : ''}
              </div>
            )}
            {dm.profile_about && (
              <p className="mt-2 text-xs text-zinc-500 line-clamp-4">{dm.profile_about}</p>
            )}
          </div>
        </div>

        {/* Lead score */}
        {dm.lead_score != null && dm.lead_score > 0 && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-medium text-zinc-400">Lead Score</h3>
            <div className="mt-2">
              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-2xl font-bold',
                  dm.lead_score >= 0.7 ? 'text-emerald-400' :
                  dm.lead_score >= 0.4 ? 'text-yellow-400' : 'text-zinc-400'
                )}>
                  {Math.round(dm.lead_score * 100)}%
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={cn(
                    'h-full rounded-full',
                    dm.lead_score >= 0.7 ? 'bg-emerald-400' :
                    dm.lead_score >= 0.4 ? 'bg-yellow-400' : 'bg-zinc-500'
                  )}
                  style={{ width: `${dm.lead_score * 100}%` }}
                />
              </div>
              {dm.lead_signals && (dm.lead_signals as string[]).length > 0 && (
                <ul className="mt-2 space-y-1">
                  {(dm.lead_signals as string[]).map((signal, i) => (
                    <li key={i} className="text-xs text-zinc-400">· {signal}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Lead analysis results */}
        {leadAnalysis && (
          <div className="rounded-lg border border-emerald-800/50 bg-emerald-900/10 p-4">
            <h3 className="text-sm font-medium text-emerald-400">Lead Analysis</h3>
            <p className="mt-2 text-xs text-zinc-300">Score: {Math.round(leadAnalysis.leadScore * 100)}%</p>
            {leadAnalysis.signals.length > 0 && (
              <div className="mt-2 space-y-1">
                {leadAnalysis.signals.map((s, i) => (
                  <div key={i} className="rounded bg-zinc-800/50 p-2">
                    <span className={cn('text-[10px] font-medium uppercase',
                      s.strength === 'strong' ? 'text-emerald-400' :
                      s.strength === 'moderate' ? 'text-yellow-400' : 'text-zinc-500'
                    )}>{s.type}</span>
                    <p className="text-xs text-zinc-400">{s.evidence}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-2 text-xs text-zinc-400">Next step: {leadAnalysis.nextStep}</p>
            {leadAnalysis.suggestedClientData && (
              <button className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600/20 px-3 py-2 text-sm text-emerald-400 hover:bg-emerald-600/30">
                <UserPlus className="h-3.5 w-3.5" />
                Create CRM Lead
              </button>
            )}
          </div>
        )}

        {/* CRM link */}
        {dm.client_name && (
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
            <h3 className="text-sm font-medium text-zinc-400">Linked CRM Client</h3>
            <p className="mt-1 text-sm text-zinc-200">{dm.client_name}</p>
            {dm.client_stage && <StatusBadge status={dm.client_stage} className="mt-1" />}
          </div>
        )}
      </div>
    </div>
  )
}
