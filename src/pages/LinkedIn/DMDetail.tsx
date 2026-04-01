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
      <div className="col-span-2 space-y-6">
        {/* Conversation header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-headline-md font-light text-on-surface">{dm.participant_name}</h2>
            {dm.participant_headline && <p className="mt-1 text-sm text-on-surface-muted">{dm.participant_headline}</p>}
          </div>
          <div className="flex items-center gap-2">
            {dm.category !== 'uncategorized' && <StatusBadge status={dm.category} />}
            <StatusBadge status={dm.priority} />
            <StatusBadge status={dm.status} />
          </div>
        </div>

        {/* Triage summary */}
        {dm.triage_summary && (
          <div className="rounded-2xl bg-primary/5 p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
              <span className="text-label-md uppercase tracking-[0.05em] text-primary">Neural Triage</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{dm.triage_summary}</p>
          </div>
        )}

        {/* Messages */}
        <div className="max-h-[500px] space-y-3 overflow-y-auto rounded-2xl bg-surface-container-low/50 p-6">
          {messages.map((msg, i) => {
            const isMe = msg.sender.toLowerCase().includes('tate') || msg.sender === 'You'
            return (
              <div key={i} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  'max-w-[75%] rounded-2xl px-4 py-3',
                  isMe ? 'bg-primary/10 text-on-surface' : 'glass',
                )}>
                  <p className="text-label-sm text-on-surface-muted">{msg.sender}</p>
                  <p className="mt-1 text-sm leading-relaxed">{msg.text}</p>
                  {msg.timestamp && <p className="mt-1.5 font-mono text-label-sm text-on-surface-muted">{formatRelative(msg.timestamp)}</p>}
                </div>
              </div>
            )
          })}
          {messages.length === 0 && <p className="py-8 text-center text-sm text-on-surface-muted">No messages scraped</p>}
        </div>

        {/* Draft reply */}
        {dm.draft_reply && (
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Draft Reply</span>
              <button
                onClick={() => send.mutate()}
                disabled={send.isPending}
                className="btn-primary-gradient flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
              >
                <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                {send.isPending ? 'Sending...' : 'Send via LinkedIn'}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-on-surface-variant">{dm.draft_reply}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {dm.triage_status !== 'complete' && (
            <button onClick={() => triage.mutate()} disabled={triage.isPending}
              className="btn-primary-gradient flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-40">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} /> {triage.isPending ? 'Triaging...' : 'AI Triage'}
            </button>
          )}
          <button onClick={() => draft.mutate()} disabled={draft.isPending}
            className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-surface-container disabled:opacity-40">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} /> {draft.isPending ? 'Drafting...' : 'Draft Reply'}
          </button>
          <button onClick={() => ignore.mutate()} disabled={ignore.isPending}
            className="flex items-center gap-2 rounded-xl bg-surface-container-high px-4 py-2.5 text-sm text-on-surface-muted transition-colors hover:bg-surface-container">
            <Archive className="h-3.5 w-3.5" strokeWidth={1.75} /> Ignore
          </button>
          <button onClick={() => analyzeLead.mutate()} disabled={analyzeLead.isPending}
            className="flex items-center gap-2 rounded-xl bg-secondary/10 px-4 py-2.5 text-sm text-secondary transition-colors hover:bg-secondary/20 disabled:opacity-40">
            <Target className="h-3.5 w-3.5" strokeWidth={1.75} /> {analyzeLead.isPending ? 'Analyzing...' : 'Analyze Lead'}
          </button>
        </div>
      </div>

      {/* Right sidebar: Profile + Lead info */}
      <div className="space-y-6">
        {/* Profile card */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Profile</h3>
          <div className="mt-4 space-y-3">
            <p className="font-display text-sm font-medium text-on-surface">{dm.participant_name}</p>
            {(dm.profile_headline || dm.participant_headline) && (
              <p className="text-xs text-on-surface-muted">{dm.profile_headline || dm.participant_headline}</p>
            )}
            {(dm.profile_company || dm.participant_company) && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
                <Building2 className="h-3 w-3" strokeWidth={1.75} />
                {dm.profile_company || dm.participant_company}
              </div>
            )}
            {dm.profile_location && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
                <MapPin className="h-3 w-3" strokeWidth={1.75} />
                {dm.profile_location}
              </div>
            )}
            {dm.profile_connection_degree && (
              <div className="flex items-center gap-1.5 text-xs text-on-surface-muted">
                <Users className="h-3 w-3" strokeWidth={1.75} />
                {dm.profile_connection_degree} connection
                {dm.profile_mutual_connections ? ` \u00b7 ${dm.profile_mutual_connections} mutual` : ''}
              </div>
            )}
            {dm.profile_about && (
              <p className="mt-2 text-xs leading-relaxed text-on-surface-muted line-clamp-4">{dm.profile_about}</p>
            )}
          </div>
        </div>

        {/* Lead score */}
        {dm.lead_score != null && dm.lead_score > 0 && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Lead Score</h3>
            <div className="mt-3">
              <span className={cn(
                'font-display text-[1.75rem] font-light',
                dm.lead_score >= 0.7 ? 'text-secondary' :
                dm.lead_score >= 0.4 ? 'text-tertiary' : 'text-on-surface-muted',
              )}>
                {Math.round(dm.lead_score * 100)}%
              </span>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-container">
                <div
                  className={cn('h-full rounded-full transition-all',
                    dm.lead_score >= 0.7 ? 'bg-secondary' :
                    dm.lead_score >= 0.4 ? 'bg-tertiary' : 'bg-on-surface-muted',
                  )}
                  style={{ width: `${dm.lead_score * 100}%` }}
                />
              </div>
              {dm.lead_signals && (dm.lead_signals as string[]).length > 0 && (
                <ul className="mt-3 space-y-1">
                  {(dm.lead_signals as string[]).map((signal, i) => (
                    <li key={i} className="text-xs text-on-surface-muted">\u00b7 {signal}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Lead analysis results */}
        {leadAnalysis && (
          <div className="rounded-2xl bg-secondary/5 p-6">
            <h3 className="text-label-md uppercase tracking-[0.05em] text-secondary">Lead Analysis</h3>
            <p className="mt-3 text-sm text-on-surface-variant">Score: {Math.round(leadAnalysis.leadScore * 100)}%</p>
            {leadAnalysis.signals.length > 0 && (
              <div className="mt-3 space-y-2">
                {leadAnalysis.signals.map((s, i) => (
                  <div key={i} className="rounded-xl bg-surface-container-low p-3">
                    <span className={cn('text-label-sm uppercase',
                      s.strength === 'strong' ? 'text-secondary' :
                      s.strength === 'moderate' ? 'text-tertiary' : 'text-on-surface-muted',
                    )}>{s.type}</span>
                    <p className="mt-0.5 text-xs text-on-surface-muted">{s.evidence}</p>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-3 text-xs text-on-surface-muted">Next step: {leadAnalysis.nextStep}</p>
            {leadAnalysis.suggestedClientData && (
              <button className="mt-4 btn-primary-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium">
                <UserPlus className="h-3.5 w-3.5" strokeWidth={1.75} />
                Create CRM Lead
              </button>
            )}
          </div>
        )}

        {/* CRM link */}
        {dm.client_name && (
          <div className="glass rounded-2xl p-6">
            <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Linked CRM Client</h3>
            <p className="mt-2 font-display text-sm font-medium text-on-surface">{dm.client_name}</p>
            {dm.client_stage && <StatusBadge status={dm.client_stage} className="mt-2" />}
          </div>
        )}
      </div>
    </div>
  )
}
