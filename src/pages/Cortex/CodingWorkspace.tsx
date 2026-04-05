/**
 * Coding Workspace — Unified auto-developer panel embedded in the Cortex coding tab.
 *
 * Three views, one surface:
 *   1. Overview — Dashboard stats + pending requests + active sessions (default)
 *   2. Session  — Full session detail with logs, pipeline, messaging
 *   3. Chat     — Falls through to normal OSChat (handled by parent)
 *
 * Design principles:
 *   - Ambient, not dashboard-y. Stats whisper, sessions pulse, requests glow.
 *   - Everything is clickable/actionable. No "tell Cortex to..." prompts.
 *   - Session detail slides in from the right (motion). Back arrow returns to overview.
 *   - Data only fetched when coding workspace is active (parent controls mount).
 *   - WS live updates merge seamlessly via cortexStore.
 */
import { useState, useEffect, useRef } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { useCortexStore } from '@/store/cortexStore'

import * as factoryApi from '@/api/factory'
import toast from 'react-hot-toast'
import {
  Activity, Inbox, CheckCircle2, Code2, AlertTriangle, ChevronLeft, ChevronRight,
  Check, X, Loader2, Square, Send, FileCode,
} from 'lucide-react'

// ─── Shared helpers ──────────────────────────────────────────────────

const PIPELINE_ORDER = ['queued', 'context', 'executing', 'testing', 'reviewing', 'deploying', 'complete']
const PIPELINE_COLORS: Record<string, string> = {
  queued: 'bg-white/30', context: 'bg-amber-400', executing: 'bg-blue-400',
  testing: 'bg-purple-400', reviewing: 'bg-indigo-400', deploying: 'bg-orange-400',
  deployed: 'bg-green-500', complete: 'bg-green-500', failed: 'bg-red-500', error: 'bg-red-500',
}

function PipelineBar({ stage }: { stage: string | null }) {
  if (!stage) return null
  const idx = PIPELINE_ORDER.indexOf(stage)
  const pct = idx >= 0 ? ((idx + 1) / PIPELINE_ORDER.length) * 100 : (stage === 'failed' || stage === 'error' ? 100 : 50)
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${PIPELINE_COLORS[stage] ?? 'bg-white/30'}`}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }}
        />
      </div>
      <span className="text-[9px] font-mono text-on-surface-muted/40 uppercase tracking-wider">{stage}</span>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: 'bg-green-500 animate-pulse', initializing: 'bg-blue-400 animate-pulse',
    completing: 'bg-blue-300', queued: 'bg-amber-400', complete: 'bg-gray-400',
    error: 'bg-red-500', paused: 'bg-amber-500', stopped: 'bg-gray-400', awaiting_input: 'bg-orange-400 animate-pulse',
  }
  return <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${colors[status] || 'bg-gray-400'}`} />
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`
  return `${Math.round(ms / 86400000)}d`
}

// ─── Log line parser ─────────────────────────────────────────────────

interface ParsedLogLine {
  type: 'text' | 'tool_use' | 'tool_result' | 'system' | 'error' | 'unknown'
  content: string
  raw: string
}

function parseLogChunk(chunk: string): ParsedLogLine {
  try {
    const obj = JSON.parse(chunk)
    if (obj.type === 'assistant' && obj.message?.content) {
      const texts = obj.message.content.map((p: any) =>
        p.type === 'text' ? p.text : p.type === 'tool_use' ? `[${p.name}] ${JSON.stringify(p.input).slice(0, 200)}` : ''
      ).filter(Boolean)
      return { type: 'text', content: texts.join('\n'), raw: chunk }
    }
    if (obj.type === 'result') return { type: 'tool_result', content: (typeof obj.result === 'string' ? obj.result : JSON.stringify(obj.result)).slice(0, 1500), raw: chunk }
    if (obj.type === 'system' || obj.type === 'error') return { type: obj.type, content: obj.message || obj.error || chunk, raw: chunk }
    if (obj.type === 'content_block_delta' && obj.delta?.text) return { type: 'text', content: obj.delta.text, raw: chunk }
    if (obj.type === 'content_block_start' && obj.content_block?.type === 'tool_use') return { type: 'tool_use', content: `→ ${obj.content_block.name}`, raw: chunk }
    return { type: 'unknown', content: chunk.slice(0, 300), raw: chunk }
  } catch {
    return { type: 'text', content: chunk, raw: chunk }
  }
}

// ─── Mini Log Viewer (embedded, compact) ─────────────────────────────

function CompactLogViewer({ sessionId, isLive }: { sessionId: string; isLive: boolean }) {
  const { data } = useQuery({
    queryKey: ['sessionLogs', sessionId, 0],
    queryFn: () => factoryApi.getSessionLogs(sessionId, { limit: 100, offset: 0 }),
    refetchInterval: isLive ? 3000 : false,
  })

  const liveOutput = useCortexStore(s => s.inlineSessions.get(sessionId)?.output || [])
  const logEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.logs?.length, liveOutput.length])

  const historicalLines = (data?.logs || []).map(l => parseLogChunk(l.chunk))
  const liveLines = liveOutput.map((c: string) => parseLogChunk(c))
  const allLines = [...historicalLines, ...liveLines]

  const typeStyles: Record<string, string> = {
    text: 'text-on-surface/70', tool_use: 'text-blue-400', tool_result: 'text-purple-400/70',
    system: 'text-amber-400/70', error: 'text-red-400', unknown: 'text-on-surface-muted/40',
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-4 py-2 font-mono text-[11px] leading-relaxed bg-black/5 rounded-lg">
      {allLines.length === 0 && (
        <div className="flex items-center justify-center h-full text-on-surface-muted/30 text-xs">
          {isLive ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
          {isLive ? 'Waiting for output...' : 'No logs yet'}
        </div>
      )}
      {allLines.map((line, i) => (
        <div key={i} className={`py-0.5 ${typeStyles[line.type] || ''}`}>
          {line.type === 'tool_use' && <span className="text-blue-500/60 mr-1">{'>'}</span>}
          <span className="whitespace-pre-wrap break-all">{line.content.slice(0, 500)}</span>
        </div>
      ))}
      <div ref={logEndRef} />
    </div>
  )
}

// ─── Session Message Input ───────────────────────────────────────────

function SessionInput({ sessionId, canMessage, isResume }: { sessionId: string; canMessage: boolean; isResume: boolean }) {
  const [msg, setMsg] = useState('')
  const sendMutation = useMutation({ mutationFn: (c: string) => factoryApi.sendSessionMessage(sessionId, c) })
  const resumeMutation = useMutation({ mutationFn: (c: string) => factoryApi.resumeSession(sessionId, c) })
  const mutation = isResume ? resumeMutation : sendMutation

  const send = () => { if (!msg.trim()) return; mutation.mutate(msg.trim()); setMsg('') }

  return (
    <div className="flex items-center gap-2 pt-2">
      {isResume && <span className="text-[10px] text-amber-500 font-medium px-1.5 py-0.5 bg-amber-500/10 rounded">Resume</span>}
      <input
        value={msg} onChange={e => setMsg(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        placeholder={!canMessage ? 'Not messageable' : isResume ? 'Resume with follow-up...' : 'Message session...'}
        disabled={!canMessage}
        className="flex-1 px-3 py-1.5 text-xs bg-white/5 border border-white/10 rounded-lg text-on-surface
                   placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/30
                   disabled:opacity-30"
      />
      <button onClick={send} disabled={!canMessage || !msg.trim() || mutation.isPending}
        className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-20 transition-colors">
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Session Detail View ─────────────────────────────────────────────

function SessionDetailView({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const queryClient = useQueryClient()
  const { data: apiSession, isLoading } = useQuery({
    queryKey: ['ccSession', sessionId],
    queryFn: () => factoryApi.getSession(sessionId),
    refetchInterval: 3000,
  })

  const liveSession = useCortexStore(s => s.inlineSessions.get(sessionId))

  if (isLoading || !apiSession) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="w-4 h-4 animate-spin text-on-surface-muted/30" /></div>
  }

  const session = liveSession ? {
    ...apiSession,
    status: liveSession.status ?? apiSession.status,
    pipeline_stage: liveSession.pipeline_stage ?? apiSession.pipeline_stage,
    confidence_score: liveSession.confidence_score ?? apiSession.confidence_score,
    commit_sha: liveSession.commit_sha ?? apiSession.commit_sha,
  } : apiSession

  const isLive = ['running', 'initializing', 'awaiting_input'].includes(session.status)
  const isResumable = session.status === 'paused' || session.status === 'complete'
  const canMessage = isLive || isResumable

  const stopMutation = useMutation({
    mutationFn: () => factoryApi.stopSession(session.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ccSessions'] }),
  })

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Back + header */}
      <div className="flex items-center gap-2 mb-3">
        <button onClick={onBack} className="p-1 rounded-lg hover:bg-white/10 text-on-surface-muted/50 hover:text-on-surface transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <StatusDot status={session.status} />
        <span className="text-xs font-mono text-on-surface-muted/50">{session.status}</span>
        <span className="text-[10px] font-mono text-on-surface-muted/30">{session.id.slice(0, 8)}</span>
        <span className="flex-1" />
        {isLive && (
          <button onClick={() => stopMutation.mutate()} disabled={stopMutation.isPending}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-30">
            <Square className="w-3 h-3" /> Stop
          </button>
        )}
      </div>

      {/* Prompt */}
      <p className="text-sm text-on-surface/80 leading-snug mb-2">{session.initial_prompt}</p>
      <PipelineBar stage={session.pipeline_stage} />

      {/* Metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] font-mono text-on-surface-muted/40">
        {(session as any).codebase_name && <span>codebase: <span className="text-primary/60">{(session as any).codebase_name}</span></span>}
        {(session as any).client_name && <span>client: {(session as any).client_name}</span>}
        <span>trigger: {session.triggered_by}</span>
        {session.confidence_score != null && <span>conf: {(session.confidence_score * 100).toFixed(0)}%</span>}
        {session.cc_cost_usd != null && session.cc_cost_usd > 0 && <span>${session.cc_cost_usd.toFixed(4)}</span>}
        {session.started_at && <span>{timeAgo(session.started_at)}</span>}
      </div>

      {/* Error */}
      {session.error_message && (
        <div className="mt-2 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertTriangle className="w-3 h-3 inline mr-1" />{session.error_message.slice(0, 300)}
        </div>
      )}

      {/* Files changed */}
      {session.files_changed && session.files_changed.length > 0 && (
        <details className="mt-2">
          <summary className="text-[10px] font-mono text-on-surface-muted/40 cursor-pointer hover:text-on-surface-muted/60">
            <FileCode className="w-3 h-3 inline mr-1" />{session.files_changed.length} files changed
          </summary>
          <div className="mt-1 p-2 bg-black/5 rounded text-[10px] font-mono text-on-surface-muted/50 max-h-24 overflow-auto">
            {session.files_changed.map((f, i) => <div key={i}>{f}</div>)}
          </div>
        </details>
      )}

      {/* Logs */}
      <div className="flex-1 min-h-0 mt-3">
        <CompactLogViewer sessionId={session.id} isLive={isLive} />
      </div>

      {/* Input */}
      <SessionInput sessionId={session.id} canMessage={canMessage} isResume={isResumable} />
    </motion.div>
  )
}

// ─── Overview: Dashboard + Requests + Sessions ───────────────────────

function OverviewView({ onSelectSession }: { onSelectSession: (id: string) => void }) {
  const queryClient = useQueryClient()

  const { data: dashboard } = useQuery({
    queryKey: ['codingDashboard'],
    queryFn: factoryApi.getCodingDashboard,
    refetchInterval: 15000,
  })

  const { data: requests } = useQuery({
    queryKey: ['codeRequests', 'pending'],
    queryFn: () => factoryApi.getCodeRequests('pending'),
    refetchInterval: 30000,
  })

  const { data: activeSessions } = useQuery({
    queryKey: ['ccSessions', 'running'],
    queryFn: () => factoryApi.getSessions({ status: 'running', limit: 10 }),
    refetchInterval: 10000,
  })

  const confirmMutation = useMutation({
    mutationFn: (id: string) => factoryApi.confirmCodeRequest(id),
    onSuccess: () => {
      toast.success('Dispatched')
      queryClient.invalidateQueries({ queryKey: ['codeRequests'] })
      queryClient.invalidateQueries({ queryKey: ['codingDashboard'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (id: string) => factoryApi.rejectCodeRequest(id, 'Rejected from workspace'),
    onSuccess: () => {
      toast.success('Rejected')
      queryClient.invalidateQueries({ queryKey: ['codeRequests'] })
      queryClient.invalidateQueries({ queryKey: ['codingDashboard'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed'),
  })

  const pending = requests?.requests ?? []
  const running = activeSessions?.sessions ?? []
  const stuckCount = dashboard?.stuckRequests ?? 0

  return (
    <div className="space-y-6 overflow-y-auto scrollbar-thin pr-1">
      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Active', value: dashboard?.activeSessions ?? 0, icon: Activity, color: 'text-green-500' },
          { label: 'Pending', value: dashboard?.pendingRequests ?? 0, icon: Inbox, color: 'text-amber-500' },
          { label: 'Done (24h)', value: dashboard?.todayCompletions ?? 0, icon: CheckCircle2, color: 'text-on-surface-muted/50' },
          { label: 'Codebases', value: dashboard?.codebases?.length ?? 0, icon: Code2, color: 'text-primary/50' },
        ].map(s => (
          <div key={s.label} className="px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`w-3 h-3 ${s.color}`} />
              <span className="text-[10px] text-on-surface-muted/40 uppercase tracking-wider">{s.label}</span>
            </div>
            <span className="text-lg font-light text-on-surface/80">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Stuck alert */}
      {stuckCount > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400 text-xs">
          <AlertTriangle className="w-3.5 h-3.5" />
          {stuckCount} stuck request{stuckCount > 1 ? 's' : ''} — ask Cortex to recover
        </div>
      )}

      {/* Active sessions */}
      {running.length > 0 && (
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted/30 mb-2">Active Sessions</h3>
          <div className="space-y-1">
            {running.map((s: any) => (
              <button
                key={s.id}
                onClick={() => onSelectSession(s.id)}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-colors"
              >
                <StatusDot status={s.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface/70 truncate">{s.initial_prompt?.slice(0, 70)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PipelineBar stage={s.pipeline_stage} />
                  </div>
                </div>
                {s.codebase_name && <span className="text-[10px] text-primary/40">{s.codebase_name}</span>}
                <ChevronRight className="w-3 h-3 text-on-surface-muted/20" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Pending code requests */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted/30 mb-2">Pending Requests</h3>
          <div className="space-y-1">
            {pending.map((r: any) => (
              <div key={r.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface/70 truncate">{r.summary}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-on-surface-muted/40">{r.source}</span>
                    {r.code_work_type && <span className="text-[10px] px-1 py-0.5 bg-primary/5 text-primary/50 rounded">{r.code_work_type}</span>}
                    {r.client_name && <span className="text-[10px] text-on-surface-muted/40">{r.client_name}</span>}
                    {r.confidence != null && <span className="text-[10px] font-mono text-on-surface-muted/30">{(r.confidence * 100).toFixed(0)}%</span>}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => confirmMutation.mutate(r.id)} disabled={confirmMutation.isPending}
                    className="p-1 rounded hover:bg-green-500/10 text-green-500/50 hover:text-green-400 transition-colors disabled:opacity-20">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => rejectMutation.mutate(r.id)} disabled={rejectMutation.isPending}
                    className="p-1 rounded hover:bg-red-500/10 text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-20">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent sessions */}
      <div>
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-on-surface-muted/30 mb-2">Recent</h3>
        <div className="space-y-0.5">
          {(dashboard?.recentSessions ?? []).map((s: any) => (
            <button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors"
            >
              <StatusDot status={s.status} />
              <p className="flex-1 text-[11px] text-on-surface/60 truncate">{s.initial_prompt?.slice(0, 60)}</p>
              {s.client_name && <span className="text-[10px] text-on-surface-muted/30">{s.client_name}</span>}
              <span className="text-[10px] font-mono text-on-surface-muted/25">{s.triggered_by}</span>
              {s.started_at && <span className="text-[10px] text-on-surface-muted/25">{timeAgo(s.started_at)}</span>}
            </button>
          ))}
          {(dashboard?.recentSessions ?? []).length === 0 && (
            <p className="text-xs text-on-surface-muted/25 py-4 text-center">No sessions yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main CodingWorkspace ────────────────────────────────────────────

export default function CodingWorkspace() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)

  // Listen for WS session events to auto-invalidate
  const queryClient = useQueryClient()
  useEffect(() => {
    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
      queryClient.invalidateQueries({ queryKey: ['codingDashboard'] })
    }
    window.addEventListener('ecodia:cc-session-update', handler)
    return () => window.removeEventListener('ecodia:cc-session-update', handler)
  }, [queryClient])

  return (
    <div className="flex flex-col h-full">
      <AnimatePresence mode="wait">
        {selectedSessionId ? (
          <SessionDetailView
            key={selectedSessionId}
            sessionId={selectedSessionId}
            onBack={() => setSelectedSessionId(null)}
          />
        ) : (
          <motion.div
            key="overview"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, x: -20 }}
            className="flex-1 min-h-0"
          >
            <OverviewView onSelectSession={setSelectedSessionId} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
