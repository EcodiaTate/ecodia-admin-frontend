import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useCortexStore } from '@/store/cortexStore'
import type { CCSession, CCSessionLog } from '@/types/claudeCode'
import * as factoryApi from '@/api/factory'
import {
  Play, Square, Send, ChevronDown, ChevronRight, RefreshCw,
  Terminal, GitBranch, AlertTriangle, CheckCircle, Clock, Loader2,
  Zap, Eye, FileCode, X, ChevronUp,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Status / Pipeline helpers ────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  initializing: 'text-yellow-600 bg-yellow-50',
  running: 'text-blue-600 bg-blue-50',
  awaiting_input: 'text-orange-600 bg-orange-50',
  complete: 'text-green-600 bg-green-50',
  error: 'text-red-600 bg-red-50',
  stopped: 'text-gray-500 bg-gray-100',
}

const PIPELINE_COLORS: Record<string, string> = {
  queued: 'bg-gray-300',
  context: 'bg-yellow-400',
  executing: 'bg-blue-400',
  testing: 'bg-purple-400',
  reviewing: 'bg-indigo-400',
  deploying: 'bg-orange-400',
  deployed: 'bg-green-500',
  complete: 'bg-green-500',
  failed: 'bg-red-500',
  error: 'bg-red-500',
}

const PIPELINE_ORDER = ['queued', 'context', 'executing', 'testing', 'reviewing', 'deploying', 'complete']

function PipelineBar({ stage }: { stage: string | null }) {
  if (!stage) return null
  const idx = PIPELINE_ORDER.indexOf(stage)
  const pct = idx >= 0 ? ((idx + 1) / PIPELINE_ORDER.length) * 100 : (stage === 'failed' || stage === 'error' ? 100 : 50)
  const color = PIPELINE_COLORS[stage] ?? 'bg-gray-400'
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
      <span className="text-[10px] font-mono text-on-surface-muted/50 uppercase tracking-wider min-w-[60px] text-right">
        {stage}
      </span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_COLORS[status] ?? 'text-gray-500 bg-gray-100'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider ${cls}`}>
      {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'error' && <AlertTriangle className="w-3 h-3" />}
      {status === 'complete' && <CheckCircle className="w-3 h-3" />}
      {status === 'awaiting_input' && <Zap className="w-3 h-3" />}
      {status === 'initializing' && <Clock className="w-3 h-3" />}
      {status}
    </span>
  )
}

// ─── Log line parser ──────────────────────────────────────────────────

interface ParsedLogLine {
  type: 'text' | 'tool_use' | 'tool_result' | 'system' | 'error' | 'unknown'
  content: string
  toolName?: string
  timestamp?: string
  raw: string
}

function parseLogChunk(chunk: string): ParsedLogLine {
  try {
    const obj = JSON.parse(chunk)

    if (obj.type === 'assistant' && obj.message?.content) {
      const parts = obj.message.content
      const texts: string[] = []
      for (const p of parts) {
        if (p.type === 'text') texts.push(p.text)
        if (p.type === 'tool_use') {
          texts.push(`[tool_use: ${p.name}] ${JSON.stringify(p.input).slice(0, 300)}`)
        }
      }
      return { type: 'text', content: texts.join('\n'), raw: chunk }
    }

    if (obj.type === 'result') {
      const content = typeof obj.result === 'string' ? obj.result : JSON.stringify(obj.result, null, 2)
      return { type: 'tool_result', content: content.slice(0, 2000), toolName: obj.tool_name, raw: chunk }
    }

    if (obj.type === 'system' || obj.type === 'error') {
      return { type: obj.type, content: obj.message || obj.error || JSON.stringify(obj), raw: chunk }
    }

    // stream-json content_block_delta with text
    if (obj.type === 'content_block_delta' && obj.delta?.text) {
      return { type: 'text', content: obj.delta.text, raw: chunk }
    }

    // Tool use start
    if (obj.type === 'content_block_start' && obj.content_block?.type === 'tool_use') {
      return { type: 'tool_use', content: `→ ${obj.content_block.name}`, toolName: obj.content_block.name, raw: chunk }
    }

    return { type: 'unknown', content: chunk.slice(0, 500), raw: chunk }
  } catch {
    return { type: 'text', content: chunk, raw: chunk }
  }
}

const LOG_TYPE_STYLES: Record<string, string> = {
  text: 'text-gray-800',
  tool_use: 'text-blue-700 bg-blue-50/50',
  tool_result: 'text-purple-700 bg-purple-50/30',
  system: 'text-yellow-700 bg-yellow-50/30',
  error: 'text-red-700 bg-red-50/50',
  unknown: 'text-gray-500',
}

// ─── Log Viewer Component ─────────────────────────────────────────────

function LogViewer({ sessionId, isLive }: { sessionId: string; isLive: boolean }) {
  const [logs, setLogs] = useState<CCSessionLog[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [filter, setFilter] = useState<'all' | 'text' | 'tool_use' | 'tool_result' | 'error'>('all')
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set())
  const [autoScroll, setAutoScroll] = useState(true)
  const logEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 200

  // Fetch historical logs
  const { data, isLoading } = useQuery({
    queryKey: ['sessionLogs', sessionId, page],
    queryFn: () => factoryApi.getSessionLogs(sessionId, { limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    refetchInterval: isLive ? 3000 : false,
  })

  useEffect(() => {
    if (data) {
      setLogs(data.logs)
      setTotal(data.total)
    }
  }, [data])

  // Live output from WebSocket (cortex store) — this updates in real time
  const inlineSession = useCortexStore(s => s.inlineSessions.get(sessionId))
  const liveOutput = inlineSession?.output ?? []

  // Auto-scroll — triggers on every new live chunk
  useEffect(() => {
    if (autoScroll && logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, liveOutput.length, autoScroll])

  // Detect manual scroll
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current
    const atBottom = scrollHeight - scrollTop - clientHeight < 60
    setAutoScroll(atBottom)
  }, [])

  const allLines: ParsedLogLine[] = [
    ...logs.map(l => parseLogChunk(l.chunk)),
    ...liveOutput.map(l => parseLogChunk(l)),
  ]

  const filtered = filter === 'all' ? allLines : allLines.filter(l => l.type === filter)

  const toggleLine = (i: number) => {
    setExpandedLines(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200/60 bg-white/30">
        <div className="flex gap-1">
          {(['all', 'text', 'tool_use', 'tool_result', 'error'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors
                ${filter === f ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            >
              {f === 'all' ? 'all' : f.replace('_', ' ')}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-gray-400">
          {filtered.length} lines · {total} total
        </span>
        {total > PAGE_SIZE && (
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => Math.max(0, p - 1))}
              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 disabled:opacity-30"
            >
              ← prev
            </button>
            <span className="text-[10px] font-mono text-gray-400">p{page + 1}</span>
            <button
              disabled={(page + 1) * PAGE_SIZE >= total}
              onClick={() => setPage(p => p + 1)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 disabled:opacity-30"
            >
              next →
            </button>
          </div>
        )}
        {isLive && (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-green-600">live</span>
          </div>
        )}
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-auto font-mono text-xs leading-relaxed"
      >
        {isLoading && logs.length === 0 && (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading logs...
          </div>
        )}
        {filtered.map((line, i) => {
          const expanded = expandedLines.has(i)
          const truncated = line.content.length > 300 && !expanded
          return (
            <div
              key={i}
              className={`px-3 py-1 border-b border-gray-100/40 hover:bg-gray-50/50 cursor-pointer ${LOG_TYPE_STYLES[line.type]}`}
              onClick={() => toggleLine(i)}
            >
              <div className="flex items-start gap-2">
                <span className="text-[9px] text-gray-300 select-none min-w-[28px] text-right pt-0.5">{i + 1}</span>
                {line.toolName && (
                  <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded shrink-0">{line.toolName}</span>
                )}
                {line.type === 'text' ? (
                  <div className="flex-1 min-w-0 prose prose-sm prose-slate max-w-none
                    prose-headings:text-sm prose-headings:font-semibold prose-headings:mt-2 prose-headings:mb-1
                    prose-p:my-0.5 prose-p:leading-snug prose-pre:bg-gray-100 prose-pre:text-[11px] prose-pre:p-2 prose-pre:rounded
                    prose-code:text-[11px] prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                    prose-ul:my-0.5 prose-ol:my-0.5 prose-li:my-0 prose-li:leading-snug
                    prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                    prose-blockquote:border-l-2 prose-blockquote:border-gray-300 prose-blockquote:pl-2 prose-blockquote:my-1 prose-blockquote:text-gray-600
                    prose-table:text-xs prose-th:p-1 prose-td:p-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {truncated ? line.content.slice(0, 300) + '…' : line.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-all flex-1 min-w-0">
                    {truncated ? line.content.slice(0, 300) + '…' : line.content}
                  </pre>
                )}
                {line.content.length > 300 && (
                  <button className="text-gray-400 shrink-0 pt-0.5">
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
              {expanded && (
                <details className="mt-1 ml-8">
                  <summary className="text-[9px] text-gray-400 cursor-pointer">raw json</summary>
                  <pre className="text-[9px] text-gray-500 whitespace-pre-wrap break-all mt-1 p-2 bg-gray-50 rounded">
                    {(() => { try { return JSON.stringify(JSON.parse(line.raw), null, 2) } catch { return line.raw } })()}
                  </pre>
                </details>
              )}
            </div>
          )
        })}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}

// ─── Message Input ────────────────────────────────────────────────────

function MessageInput({ sessionId, disabled }: { sessionId: string; disabled: boolean }) {
  const [msg, setMsg] = useState('')
  const mutation = useMutation({
    mutationFn: (content: string) => factoryApi.sendSessionMessage(sessionId, content),
  })

  const send = () => {
    if (!msg.trim()) return
    mutation.mutate(msg.trim())
    setMsg('')
  }

  return (
    <div className="flex items-center gap-2 p-2 border-t border-gray-200/60 bg-white/30">
      <input
        value={msg}
        onChange={e => setMsg(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
        placeholder={disabled ? 'Session not running' : 'Send message to session (follow-up, answer question)...'}
        disabled={disabled}
        className="flex-1 px-3 py-1.5 text-sm bg-white/60 border border-gray-200/60 rounded-lg
                   placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/30
                   disabled:opacity-40 disabled:cursor-not-allowed"
      />
      <button
        onClick={send}
        disabled={disabled || !msg.trim() || mutation.isPending}
        className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20
                   disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <Send className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Session Row ──────────────────────────────────────────────────────

function SessionRow({ session, isSelected, onSelect }: {
  session: CCSession
  isSelected: boolean
  onSelect: () => void
}) {
  const isLive = session.status === 'running' || session.status === 'initializing' || session.status === 'awaiting_input'
  const age = session.started_at ? timeAgo(session.started_at) : ''

  // Flash on WS updates — brief highlight when session data changes live
  const [flash, setFlash] = useState(false)
  const prevStageRef = useRef(session.pipeline_stage)
  const prevStatusRef = useRef(session.status)
  useEffect(() => {
    if (session.pipeline_stage !== prevStageRef.current || session.status !== prevStatusRef.current) {
      prevStageRef.current = session.pipeline_stage
      prevStatusRef.current = session.status
      setFlash(true)
      const t = setTimeout(() => setFlash(false), 1200)
      return () => clearTimeout(t)
    }
  }, [session.pipeline_stage, session.status])

  // Live output chunk count — shows activity for running sessions
  const liveChunks = useCortexStore(s => s.inlineSessions.get(session.id)?.output?.length ?? 0)

  return (
    <div
      onClick={onSelect}
      className={`px-3 py-2.5 cursor-pointer border-b border-gray-100/50 transition-all duration-300
        ${isSelected ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-gray-50/50 border-l-2 border-l-transparent'}
        ${flash ? 'bg-primary/8' : ''}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <StatusBadge status={session.status} />
        <span className="text-[10px] font-mono text-gray-400">{session.triggered_by}</span>
        <span className="flex-1" />
        <span className="text-[10px] font-mono text-gray-300">{age}</span>
        {isSelected ? <ChevronDown className="w-3 h-3 text-gray-400" /> : <ChevronRight className="w-3 h-3 text-gray-400" />}
      </div>
      <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{session.initial_prompt}</p>
      <PipelineBar stage={session.pipeline_stage} />
      <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-400 font-mono">
        {session.confidence_score !== null && (
          <span>conf: {(session.confidence_score * 100).toFixed(0)}%</span>
        )}
        {session.files_changed && session.files_changed.length > 0 && (
          <span className="flex items-center gap-0.5"><FileCode className="w-3 h-3" /> {session.files_changed.length} files</span>
        )}
        {session.commit_sha && (
          <span className="flex items-center gap-0.5"><GitBranch className="w-3 h-3" /> {session.commit_sha.slice(0, 8)}</span>
        )}
        {session.cc_cost_usd != null && session.cc_cost_usd > 0 && (
          <span>${session.cc_cost_usd.toFixed(4)}</span>
        )}
        {isLive && (
          <span className="text-green-500 flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> live
            {liveChunks > 0 && <span className="text-green-400 ml-1">({liveChunks})</span>}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Session Detail Panel ─────────────────────────────────────────────

function SessionDetail({ session: apiSession }: { session: CCSession }) {
  // Merge with live WS data — WS updates are fresher than polled API data
  const liveSession = useCortexStore(s => s.inlineSessions.get(apiSession.id))
  const session = liveSession
    ? {
        ...apiSession,
        status: liveSession.status ?? apiSession.status,
        pipeline_stage: liveSession.pipeline_stage ?? apiSession.pipeline_stage,
        confidence_score: liveSession.confidence_score ?? apiSession.confidence_score,
        commit_sha: liveSession.commit_sha ?? apiSession.commit_sha,
      }
    : apiSession
  const isLive = session.status === 'running' || session.status === 'initializing' || session.status === 'awaiting_input'
  const canMessage = session.status === 'running' || session.status === 'awaiting_input'
  const queryClient = useQueryClient()

  const stopMutation = useMutation({
    mutationFn: () => factoryApi.stopSession(session.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ccSessions'] }),
  })

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200/60 bg-white/40">
        <div className="flex items-center gap-2 mb-2">
          <StatusBadge status={session.status} />
          <span className="text-[10px] font-mono text-gray-400">{session.id.slice(0, 8)}</span>
          <span className="flex-1" />
          {isLive && (
            <button
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono uppercase tracking-wider
                         bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors
                         disabled:opacity-40"
            >
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
        </div>
        <p className="text-sm text-gray-800 leading-snug mb-2">{session.initial_prompt}</p>
        <PipelineBar stage={session.pipeline_stage} />

        {/* Metadata grid */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] font-mono">
          <MetaItem label="trigger" value={session.triggered_by} />
          <MetaItem label="source" value={session.trigger_source ?? '—'} />
          <MetaItem label="codebase" value={session.codebase_id?.slice(0, 8) ?? '—'} />
          <MetaItem label="working dir" value={session.working_dir ?? '—'} />
          <MetaItem label="deploy" value={session.deploy_status ?? '—'} />
          <MetaItem label="cost" value={session.cc_cost_usd != null ? `$${session.cc_cost_usd.toFixed(4)}` : '—'} />
          {session.confidence_score != null && (
            <MetaItem label="confidence" value={`${(session.confidence_score * 100).toFixed(1)}%`} />
          )}
          {session.commit_sha && <MetaItem label="commit" value={session.commit_sha.slice(0, 12)} />}
          <MetaItem label="started" value={session.started_at ? new Date(session.started_at).toLocaleString() : '—'} />
          {session.completed_at && <MetaItem label="completed" value={new Date(session.completed_at).toLocaleString()} />}
        </div>

        {/* Error message */}
        {session.error_message && (
          <div className="mt-3 p-2 rounded bg-red-50 border border-red-100">
            <div className="flex items-center gap-1 text-[10px] font-mono text-red-600 mb-1">
              <AlertTriangle className="w-3 h-3" /> Error
            </div>
            <pre className="text-xs text-red-700 whitespace-pre-wrap break-all">{session.error_message}</pre>
          </div>
        )}

        {/* Files changed */}
        {session.files_changed && session.files_changed.length > 0 && (
          <details className="mt-3">
            <summary className="text-[10px] font-mono text-gray-500 cursor-pointer hover:text-gray-700">
              <FileCode className="w-3 h-3 inline mr-1" />{session.files_changed.length} files changed
            </summary>
            <div className="mt-1 p-2 bg-gray-50 rounded text-[10px] font-mono text-gray-600 max-h-32 overflow-auto">
              {session.files_changed.map((f, i) => <div key={i}>{f}</div>)}
            </div>
          </details>
        )}
      </div>

      {/* Log viewer */}
      <div className="flex-1 min-h-0">
        <LogViewer sessionId={session.id} isLive={isLive} />
      </div>

      {/* Message input */}
      <MessageInput sessionId={session.id} disabled={!canMessage} />
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="overflow-hidden">
      <div className="text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-gray-600 truncate" title={value}>{value}</div>
    </div>
  )
}

// ─── New Session Dialog ───────────────────────────────────────────────

function NewSessionPanel({ onCreated, onClose }: { onCreated: () => void; onClose: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [workingDir, setWorkingDir] = useState('')
  const [codebaseId, setCodebaseId] = useState('')
  const mutation = useMutation({
    mutationFn: () => factoryApi.createSession({
      initialPrompt: prompt,
      triggeredBy: 'manual',
      ...(workingDir && { workingDir }),
      ...(codebaseId && { codebaseId }),
    }),
    onSuccess: () => { onCreated(); setPrompt(''); setWorkingDir(''); setCodebaseId('') },
  })

  return (
    <div className="p-4 border-b border-gray-200/60 bg-white/50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1">
          <Play className="w-3 h-3" /> New Session
        </h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder="What should the Factory do? (prompt for Cortex dispatch)"
        rows={3}
        className="w-full px-3 py-2 text-sm bg-white/60 border border-gray-200/60 rounded-lg
                   placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
      />
      <div className="flex gap-2 mt-2">
        <input
          value={workingDir}
          onChange={e => setWorkingDir(e.target.value)}
          placeholder="Working dir (optional)"
          className="flex-1 px-2 py-1 text-xs font-mono bg-white/40 border border-gray-200/40 rounded
                     placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
        <input
          value={codebaseId}
          onChange={e => setCodebaseId(e.target.value)}
          placeholder="Codebase ID (optional)"
          className="flex-1 px-2 py-1 text-xs font-mono bg-white/40 border border-gray-200/40 rounded
                     placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-primary/20"
        />
      </div>
      <div className="flex justify-end mt-2">
        <button
          onClick={() => mutation.mutate()}
          disabled={!prompt.trim() || mutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider
                     bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
          Dispatch
        </button>
      </div>
      {mutation.isError && (
        <p className="text-xs text-red-600 mt-2">Error: {(mutation.error as Error).message}</p>
      )}
    </div>
  )
}

// ─── Time ago helper ──────────────────────────────────────────────────

function timeAgo(date: string): string {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

// ─── Main Page ────────────────────────────────────────────────────────

export default function FactoryDevPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showNewSession, setShowNewSession] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['ccSessions', statusFilter],
    queryFn: () => factoryApi.getSessions({ limit: 50, ...(statusFilter && { status: statusFilter }) }),
    refetchInterval: 5000,
  })

  const sessions = data?.sessions ?? []
  const total = data?.total ?? 0
  const selected = sessions.find(s => s.id === selectedId)

  // Register all running sessions in cortexStore so WS output chunks are captured.
  // Without this, cc:output events for sessions that existed before page load are lost.
  const registerCCSession = useCortexStore(s => s.registerCCSession)
  useEffect(() => {
    for (const s of sessions) {
      if (s.status === 'running' || s.status === 'initializing' || s.status === 'awaiting_input') {
        registerCCSession(s)
      }
    }
  }, [sessions, registerCCSession])

  // Listen for WS-driven session updates and immediately invalidate React Query caches.
  // The WebSocket hook updates cortexStore, but React Query caches (session list + detail)
  // still show stale data until their next poll. This bridges the gap.
  useEffect(() => {
    function handleWSEvent(e: Event) {
      const detail = (e as CustomEvent).detail
      if (!detail) return
      // Invalidate the selected session detail immediately
      if (detail.sessionId && detail.sessionId === selectedId) {
        queryClient.invalidateQueries({ queryKey: ['ccSession', selectedId] })
        queryClient.invalidateQueries({ queryKey: ['sessionLogs', selectedId] })
      }
      // Invalidate session list for stage/status changes
      queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
    }
    window.addEventListener('ecodia:cc-session-update', handleWSEvent)
    return () => window.removeEventListener('ecodia:cc-session-update', handleWSEvent)
  }, [selectedId, queryClient])

  // Also fetch fresh detail for selected
  const { data: freshSelected } = useQuery({
    queryKey: ['ccSession', selectedId],
    queryFn: () => selectedId ? factoryApi.getSession(selectedId) : null,
    enabled: !!selectedId,
    refetchInterval: selectedId ? 3000 : false,
  })

  const activeSession = freshSelected ?? selected

  // Live session updates from WS
  const inlineSessions = useCortexStore(s => s.inlineSessions)

  // Merge live WS status into sessions — WS data is fresher than polled API data
  const mergedSessions = sessions.map(s => {
    const live = inlineSessions.get(s.id)
    if (live) {
      return {
        ...s,
        status: live.status ?? s.status,
        pipeline_stage: live.pipeline_stage ?? s.pipeline_stage,
        confidence_score: live.confidence_score ?? s.confidence_score,
        commit_sha: live.commit_sha ?? s.commit_sha,
      }
    }
    return s
  })

  const liveSessions = mergedSessions.filter(s => s.status === 'running' || s.status === 'awaiting_input' || s.status === 'initializing')
  const doneSessions = mergedSessions.filter(s => s.status !== 'running' && s.status !== 'awaiting_input' && s.status !== 'initializing')

  return (
    <SpatialLayer z={20} className="h-full">
      <div className="flex h-[calc(100vh-48px)] gap-0">
        {/* Left: Session list */}
        <div className="w-[380px] shrink-0 flex flex-col border-r border-gray-200/40 bg-white/20">
          {/* Header */}
          <div className="px-3 py-3 border-b border-gray-200/60 bg-white/40">
            <div className="flex items-center gap-2 mb-2">
              <Terminal className="w-4 h-4 text-primary" />
              <h1 className="text-sm font-mono uppercase tracking-wider text-gray-700">Factory Dev</h1>
              <span className="flex-1" />
              <span className="text-[10px] font-mono text-gray-400">{total} sessions</span>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['ccSessions'] })}
                className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowNewSession(v => !v)}
                className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status filter */}
            <div className="flex gap-1 flex-wrap">
              {['', 'running', 'awaiting_input', 'error', 'complete', 'stopped'].map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-colors
                    ${statusFilter === s ? 'bg-primary/10 text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                >
                  {s || 'all'}
                </button>
              ))}
            </div>
          </div>

          {/* New session panel */}
          <AnimatePresence>
            {showNewSession && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <NewSessionPanel
                  onCreated={() => { queryClient.invalidateQueries({ queryKey: ['ccSessions'] }); setShowNewSession(false) }}
                  onClose={() => setShowNewSession(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Session list */}
          <div className="flex-1 overflow-auto">
            {isLoading && sessions.length === 0 && (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading...
              </div>
            )}

            {/* Live sessions first */}
            {liveSessions.length > 0 && (
              <>
                <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-green-600 bg-green-50/30 border-b border-green-100/40 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                </div>
                {liveSessions.map(s => (
                  <SessionRow key={s.id} session={s} isSelected={s.id === selectedId} onSelect={() => setSelectedId(s.id)} />
                ))}
              </>
            )}

            {/* Completed / errored */}
            {doneSessions.length > 0 && (
              <>
                {liveSessions.length > 0 && (
                  <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-gray-400 bg-gray-50/30 border-b border-gray-100/40">
                    History
                  </div>
                )}
                {doneSessions.map(s => (
                  <SessionRow key={s.id} session={s} isSelected={s.id === selectedId} onSelect={() => setSelectedId(s.id)} />
                ))}
              </>
            )}

            {sessions.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400 text-sm">
                <Terminal className="w-8 h-8 mb-2 opacity-30" />
                No sessions found
              </div>
            )}
          </div>
        </div>

        {/* Right: Detail panel */}
        <div className="flex-1 min-w-0 flex flex-col bg-white/10">
          {activeSession ? (
            <SessionDetail session={activeSession} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <Eye className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">Select a session to inspect</p>
              <p className="text-[10px] font-mono mt-1 text-gray-300">
                View logs · send messages · debug pipeline
              </p>
            </div>
          )}
        </div>
      </div>
    </SpatialLayer>
  )
}
