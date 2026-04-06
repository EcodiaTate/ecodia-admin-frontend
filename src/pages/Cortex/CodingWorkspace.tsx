/**
 * Coding Workspace — Unified auto-developer panel embedded in the Cortex coding tab.
 *
 * Three views, one surface:
 *   1. Overview — Dashboard stats + pending requests + active sessions (default)
 *   2. Session  — Full session detail with logs, pipeline, messaging
 *   3. Chat     — Falls through to normal OSChat (handled by parent)
 *
 * Design principles:
 *   - Glass panes, spring physics, ambient atmosphere. No dark backgrounds.
 *   - Sessions pulse with life. Stats whisper. Requests glow softly.
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
  Check, X, Square, Send, Cpu, GitBranch, Clock, Zap,
} from 'lucide-react'

// ─── Spring configs ─────────────────────────────────────────────────

const SPRING_GLIDE = { type: 'spring' as const, stiffness: 90, damping: 22 }
const SPRING_SLOW = { type: 'spring' as const, stiffness: 70, damping: 20, mass: 1.1 }
const SPRING_ENTRANCE = { type: 'spring' as const, stiffness: 80, damping: 22 }

// ─── Shared helpers ──────────────────────────────────────────────────

const PIPELINE_ORDER = ['queued', 'context', 'executing', 'testing', 'reviewing', 'deploying', 'complete']
const PIPELINE_LABELS: Record<string, string> = {
  queued: 'Queued', context: 'Context', executing: 'Executing',
  testing: 'Testing', reviewing: 'Review', deploying: 'Deploy',
  complete: 'Complete', deployed: 'Deployed', failed: 'Failed', error: 'Error',
}

const PIPELINE_COLORS: Record<string, string> = {
  queued: 'bg-on-surface-muted/20', context: 'bg-tertiary/70', executing: 'bg-primary/70',
  testing: 'bg-primary-container/70', reviewing: 'bg-primary/50', deploying: 'bg-tertiary/60',
  deployed: 'bg-secondary/70', complete: 'bg-secondary/70', failed: 'bg-error/70', error: 'bg-error/70',
}

function PipelineBar({ stage }: { stage: string | null }) {
  if (!stage) return null
  const idx = PIPELINE_ORDER.indexOf(stage)
  const pct = idx >= 0 ? ((idx + 1) / PIPELINE_ORDER.length) * 100 : (stage === 'failed' || stage === 'error' ? 100 : 50)
  return (
    <div className="flex items-center gap-3 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-surface-container overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${PIPELINE_COLORS[stage] ?? 'bg-on-surface-muted/20'}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={SPRING_GLIDE}
        />
      </div>
      <span className="text-label-sm font-mono text-on-surface-muted/60 uppercase tracking-wider">
        {PIPELINE_LABELS[stage] ?? stage}
      </span>
    </div>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    running: 'bg-secondary', initializing: 'bg-primary-container',
    completing: 'bg-primary-container/70', queued: 'bg-tertiary', complete: 'bg-on-surface-muted/40',
    error: 'bg-error', paused: 'bg-tertiary', stopped: 'bg-on-surface-muted/40', awaiting_input: 'bg-tertiary',
  }
  const isPulsing = ['running', 'initializing', 'awaiting_input'].includes(status)
  return (
    <div className="relative flex-shrink-0">
      <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-on-surface-muted/40'}`} />
      {isPulsing && (
        <motion.div
          className={`absolute inset-0 w-2 h-2 rounded-full ${colors[status] || 'bg-on-surface-muted/40'}`}
          animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  )
}

function timeAgo(date: string) {
  const ms = Date.now() - new Date(date).getTime()
  if (ms < 60000) return 'now'
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`
  return `${Math.round(ms / 86400000)}d`
}

/** Safely coerce anything to a renderable string */
function safeStr(val: unknown): string {
  if (val === null || val === undefined) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'number' || typeof val === 'boolean') return String(val)
  try { return JSON.stringify(val) } catch { return '[object]' }
}

/** Safely coerce a value to a number (Postgres numeric comes as string) */
function safeNum(val: unknown): number | null {
  if (val === null || val === undefined) return null
  const n = Number(val)
  return Number.isFinite(n) ? n : null
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
      const texts = (Array.isArray(obj.message.content) ? obj.message.content : []).map((p: any) =>
        p.type === 'text' ? safeStr(p.text) : p.type === 'tool_use' ? `[${safeStr(p.name)}] ${safeStr(p.input).slice(0, 200)}` : ''
      ).filter(Boolean)
      return { type: 'text', content: texts.join('\n'), raw: chunk }
    }
    if (obj.type === 'result') return { type: 'tool_result', content: safeStr(obj.result).slice(0, 1500), raw: chunk }
    if (obj.type === 'system' || obj.type === 'error') return { type: obj.type, content: safeStr(obj.message || obj.error || chunk), raw: chunk }
    if (obj.type === 'content_block_delta' && obj.delta?.text) return { type: 'text', content: safeStr(obj.delta.text), raw: chunk }
    if (obj.type === 'content_block_start' && obj.content_block?.type === 'tool_use') return { type: 'tool_use', content: `→ ${safeStr(obj.content_block.name)}`, raw: chunk }
    return { type: 'unknown', content: safeStr(chunk).slice(0, 300), raw: chunk }
  } catch {
    return { type: 'text', content: safeStr(chunk), raw: chunk }
  }
}

// ─── Mini Log Viewer (embedded, compact, glass) ──────────────────────

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
    text: 'text-on-surface-variant/80',
    tool_use: 'text-primary/70',
    tool_result: 'text-primary-container/80',
    system: 'text-tertiary/70',
    error: 'text-error/80',
    unknown: 'text-on-surface-muted/50',
  }

  const typeIndicators: Record<string, string> = {
    tool_use: 'bg-primary/15',
    tool_result: 'bg-primary-container/10',
    system: 'bg-tertiary/10',
    error: 'bg-error/10',
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin rounded-2xl bg-surface-container-low/60 px-4 py-3">
      {allLines.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={SPRING_SLOW}
          className="flex flex-col items-center justify-center h-full gap-3"
        >
          {isLive ? (
            <>
              <motion.div
                className="w-6 h-6 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span className="text-label-sm font-mono text-on-surface-muted/40">Awaiting output</span>
            </>
          ) : (
            <span className="text-label-sm font-mono text-on-surface-muted/30">No logs</span>
          )}
        </motion.div>
      )}
      {allLines.map((line, i) => (
        <motion.div
          key={i}
          initial={i > allLines.length - 5 ? { opacity: 0, y: 4 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className={`py-0.5 flex items-start gap-2 font-mono text-[11px] leading-relaxed ${typeStyles[line.type] || ''}`}
        >
          {typeIndicators[line.type] && (
            <span className={`mt-1.5 w-1 h-1 rounded-full flex-shrink-0 ${typeIndicators[line.type]}`} />
          )}
          <span className="whitespace-pre-wrap break-all">{line.content.slice(0, 500)}</span>
        </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING_GLIDE}
      className="flex items-center gap-2 pt-3"
    >
      {isResume && (
        <span className="text-label-sm font-medium px-2 py-1 bg-tertiary/10 text-tertiary/80 rounded-full">
          Resume
        </span>
      )}
      <input
        value={msg} onChange={e => setMsg(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        placeholder={!canMessage ? 'Session not messageable' : isResume ? 'Resume with follow-up...' : 'Message session...'}
        disabled={!canMessage}
        className="flex-1 px-4 py-2 text-xs bg-surface-container-low rounded-xl text-on-surface
                   placeholder:text-on-surface-muted/30 focus:outline-none focus:ring-1 focus:ring-primary/20
                   focus:bg-surface-container-lowest transition-all
                   disabled:opacity-30"
      />
      <motion.button
        onClick={send}
        disabled={!canMessage || !msg.trim() || mutation.isPending}
        whileTap={canMessage && msg.trim() ? { scale: 0.92 } : {}}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl
                   bg-primary/10 text-primary hover:bg-primary/18 transition-all
                   disabled:opacity-20"
      >
        <Send className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
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

  // All hooks MUST be called before any early return (Rules of Hooks)
  const stopMutation = useMutation({
    mutationFn: () => factoryApi.stopSession(sessionId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ccSessions'] }),
  })

  if (isLoading || !apiSession) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <motion.div
          className="w-8 h-8 rounded-full bg-primary/8"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="text-label-sm font-mono text-on-surface-muted/30">Loading session</span>
      </div>
    )
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

  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={SPRING_ENTRANCE}
      className="flex flex-col h-full"
    >
      {/* Back + header — sticky, always visible */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <motion.button
          onClick={onBack}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.9 }}
          className="flex h-7 w-7 items-center justify-center rounded-xl
                     bg-surface-container-low hover:bg-surface-container text-on-surface-muted/50
                     hover:text-on-surface transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
        <StatusDot status={session.status} />
        <span className="text-xs font-medium text-on-surface-variant/70 capitalize">{session.status}</span>
        <span className="text-label-sm font-mono text-on-surface-muted/30">{session.id.slice(0, 8)}</span>
        <span className="flex-1" />
        {isLive && (
          <motion.button
            onClick={() => stopMutation.mutate()}
            disabled={stopMutation.isPending}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-label-sm font-mono rounded-xl
                       bg-error/8 text-error/60 hover:bg-error/12 hover:text-error/80
                       transition-all disabled:opacity-30"
          >
            <Square className="w-3 h-3" /> Stop
          </motion.button>
        )}
      </div>

      {/* Info section — flex-shrink-0 so it never gets pushed away */}
      <div className="flex-shrink-0">
        {/* Prompt */}
        <p className="text-sm text-on-surface/80 leading-relaxed mb-3 font-medium">
          {safeStr(session.initial_prompt)}
        </p>
        <PipelineBar stage={session.pipeline_stage} />

        {/* Metadata — floating glass chips */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(session as any).codebase_name && (
            <MetaChip icon={<Code2 className="w-3 h-3" />} label={safeStr((session as any).codebase_name)} accent />
          )}
          {(session as any).client_name && (
            <MetaChip icon={<Cpu className="w-3 h-3" />} label={safeStr((session as any).client_name)} />
          )}
          <MetaChip icon={<Zap className="w-3 h-3" />} label={safeStr(session.triggered_by)} />
          {safeNum(session.confidence_score) != null && (
            <MetaChip icon={<Activity className="w-3 h-3" />} label={`${(safeNum(session.confidence_score)! * 100).toFixed(0)}%`} />
          )}
          {(safeNum(session.cc_cost_usd) ?? 0) > 0 && (
            <MetaChip label={`$${safeNum(session.cc_cost_usd)!.toFixed(4)}`} />
          )}
          {session.started_at && (
            <MetaChip icon={<Clock className="w-3 h-3" />} label={timeAgo(session.started_at)} />
          )}
        </div>

        {/* Error */}
        {session.error_message && (
          <div className="mt-3">
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-error/6 text-xs text-error/80">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <span>{safeStr(session.error_message).slice(0, 300)}</span>
            </div>
          </div>
        )}

        {/* Files changed */}
        {session.files_changed && session.files_changed.length > 0 && (
          <details className="mt-3 group">
            <summary className="flex items-center gap-2 text-label-sm font-mono text-on-surface-muted/50 cursor-pointer hover:text-on-surface-muted/70 transition-colors">
              <GitBranch className="w-3 h-3" />
              {session.files_changed.length} files changed
            </summary>
            <div className="mt-2 p-3 rounded-xl bg-surface-container-low/60 text-label-sm font-mono text-on-surface-muted/60 max-h-24 overflow-auto space-y-0.5">
              {session.files_changed.map((f, i) => <div key={i}>{safeStr(f)}</div>)}
            </div>
          </details>
        )}
      </div>

      {/* Logs — fills remaining space, scrolls internally */}
      <div className="flex-1 min-h-0 mt-4">
        <CompactLogViewer sessionId={session.id} isLive={isLive} />
      </div>

      {/* Input — pinned to bottom */}
      <div className="flex-shrink-0">
        <SessionInput sessionId={session.id} canMessage={canMessage} isResume={isResumable} />
      </div>
    </motion.div>
  )
}

/** Tiny metadata chip — glass-like, floating */
function MetaChip({ icon, label, accent }: { icon?: React.ReactNode; label: string; accent?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-label-sm font-mono
      ${accent ? 'bg-primary/8 text-primary/70' : 'bg-surface-container text-on-surface-muted/50'}`}>
      {icon}
      {label}
    </span>
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

  const stats = [
    { label: 'Active', value: dashboard?.activeSessions ?? 0, icon: Activity, color: 'text-secondary' },
    { label: 'Pending', value: dashboard?.pendingRequests ?? 0, icon: Inbox, color: 'text-tertiary' },
    { label: 'Done 24h', value: dashboard?.todayCompletions ?? 0, icon: CheckCircle2, color: 'text-on-surface-muted/60' },
    { label: 'Codebases', value: dashboard?.codebases?.length ?? 0, icon: Code2, color: 'text-primary/60' },
  ]

  return (
    <div className="space-y-6 pr-1">
      {/* Stats row — WhisperStat-style ambient numbers */}
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING_ENTRANCE, delay: i * 0.04 }}
            className="relative px-3 py-3 rounded-2xl bg-surface-container-lowest/60 group
                       hover:shadow-glass transition-shadow"
          >
            <s.icon className={`absolute top-3 right-3 w-4 h-4 ${s.color} opacity-[0.15]`} strokeWidth={1.5} />
            <span className="text-label-sm text-on-surface-muted/45 uppercase tracking-wider block mb-1">
              {s.label}
            </span>
            <motion.span
              className={`text-xl font-display font-light ${s.color}`}
              key={s.value}
              initial={{ opacity: 0.5, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SPRING_GLIDE}
            >
              {s.value}
            </motion.span>
          </motion.div>
        ))}
      </div>

      {/* Stuck alert */}
      <AnimatePresence>
        {stuckCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-tertiary/8 text-tertiary/80 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              {stuckCount} stuck request{stuckCount > 1 ? 's' : ''} — ask Cortex to recover
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active sessions */}
      <AnimatePresence>
        {running.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING_SLOW}
          >
            <h3 className="text-label-sm font-mono uppercase tracking-widest text-on-surface-muted/35 mb-2.5">
              Active Sessions
            </h3>
            <div className="space-y-1.5">
              {running.map((s: any, i: number) => (
                <motion.button
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_ENTRANCE, delay: i * 0.03 }}
                  whileHover={{ y: -1, transition: SPRING_GLIDE }}
                  className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-2xl
                             bg-surface-container-lowest/50 hover:bg-surface-container-lowest
                             hover:shadow-glass transition-shadow cursor-pointer group"
                >
                  <StatusDot status={s.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface/70 truncate leading-relaxed">
                      {safeStr(s.initial_prompt?.slice(0, 70))}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <PipelineBar stage={s.pipeline_stage} />
                    </div>
                  </div>
                  {s.codebase_name && (
                    <span className="text-label-sm text-primary/40 font-mono">{safeStr(s.codebase_name)}</span>
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-on-surface-muted/20 group-hover:text-on-surface-muted/40 transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending code requests */}
      <AnimatePresence>
        {pending.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={SPRING_SLOW}
          >
            <h3 className="text-label-sm font-mono uppercase tracking-widest text-on-surface-muted/35 mb-2.5">
              Pending Requests
            </h3>
            <div className="space-y-1.5">
              {pending.map((r: any, i: number) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING_ENTRANCE, delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl
                             bg-surface-container-lowest/50"
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-tertiary" />
                    <motion.div
                      className="absolute inset-0 w-2 h-2 rounded-full bg-tertiary"
                      animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-on-surface/70 truncate">{safeStr(r.summary)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-label-sm text-on-surface-muted/40 font-mono">{safeStr(r.source)}</span>
                      {r.code_work_type && (
                        <span className="text-label-sm px-2 py-0.5 bg-primary/6 text-primary/50 rounded-full font-mono">
                          {safeStr(r.code_work_type)}
                        </span>
                      )}
                      {r.client_name && (
                        <span className="text-label-sm text-on-surface-muted/40">{safeStr(r.client_name)}</span>
                      )}
                      {safeNum(r.confidence) != null && (
                        <span className="text-label-sm font-mono text-on-surface-muted/30">
                          {(safeNum(r.confidence)! * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <motion.button
                      onClick={() => confirmMutation.mutate(r.id)}
                      disabled={confirmMutation.isPending}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-7 w-7 items-center justify-center rounded-xl
                                 hover:bg-secondary/10 text-secondary/40 hover:text-secondary
                                 transition-colors disabled:opacity-20"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </motion.button>
                    <motion.button
                      onClick={() => rejectMutation.mutate(r.id)}
                      disabled={rejectMutation.isPending}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="flex h-7 w-7 items-center justify-center rounded-xl
                                 hover:bg-error/10 text-error/30 hover:text-error/70
                                 transition-colors disabled:opacity-20"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent sessions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING_SLOW, delay: 0.1 }}
      >
        <h3 className="text-label-sm font-mono uppercase tracking-widest text-on-surface-muted/35 mb-2.5">
          Recent
        </h3>
        <div className="space-y-0.5">
          {(dashboard?.recentSessions ?? []).map((s: any, i: number) => (
            <motion.button
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING_ENTRANCE, delay: 0.12 + i * 0.025 }}
              whileHover={{ x: 3, transition: SPRING_GLIDE }}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl
                         hover:bg-surface-container-low/60 transition-colors group"
            >
              <StatusDot status={s.status} />
              <p className="flex-1 text-[11px] text-on-surface/55 truncate group-hover:text-on-surface/70 transition-colors">
                {safeStr(s.initial_prompt?.slice(0, 60))}
              </p>
              {s.client_name && (
                <span className="text-label-sm text-on-surface-muted/30">{safeStr(s.client_name)}</span>
              )}
              <span className="text-label-sm font-mono text-on-surface-muted/25">{safeStr(s.triggered_by)}</span>
              {s.started_at && (
                <span className="text-label-sm text-on-surface-muted/25">{timeAgo(s.started_at)}</span>
              )}
            </motion.button>
          ))}
          {(dashboard?.recentSessions ?? []).length === 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-on-surface-muted/25 py-8 text-center font-mono"
            >
              No sessions yet
            </motion.p>
          )}
        </div>
      </motion.div>
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
    <div className="relative h-full overflow-hidden px-4 py-4">
      {selectedSessionId ? (
        <div className="absolute inset-0 px-4 py-4 flex flex-col">
          <SessionDetailView
            sessionId={selectedSessionId}
            onBack={() => setSelectedSessionId(null)}
          />
        </div>
      ) : (
        <div className="h-full overflow-y-auto scrollbar-thin">
          <OverviewView onSelectSession={setSelectedSessionId} />
        </div>
      )}
    </div>
  )
}
