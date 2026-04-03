/**
 * Inline Claude Code session block — renders live terminal output directly in
 * the Cortex chat thread. No navigation, no separate page, no stop/start clunk.
 *
 * Subscribes to cortexStore.inlineSessions[sessionId] for live output.
 * Output is fed by the WebSocket handler (useWebSocket → cortexStore.appendCCOutput).
 */
import { useState, useRef, useEffect, useMemo } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Terminal, Square, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, XCircle, Clock, DollarSign,
  GitBranch, Rocket,
} from 'lucide-react'
import { useCortexStore } from '@/store/cortexStore'
import { getSessionLogs, stopSession } from '@/api/claudeCode'
import type { CCSessionBlock as CCSessionBlockType } from '@/types/cortex'
import type { CCSessionLog } from '@/types/claudeCode'
import { formatRelative } from '@/lib/utils'

// ─── Output parser (lifted from ClaudeCode/Terminal.tsx) ──────────────────────

interface ParsedBlock {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system' | 'error' | 'log'
  content: string
  collapsed?: boolean
}

function extractJsonObjects(raw: string): unknown[] {
  const objects: unknown[] = []
  let depth = 0
  let start = -1
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (ch === '{') { if (depth === 0) start = i; depth++ }
    else if (ch === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try { objects.push(JSON.parse(raw.slice(start, i + 1))) } catch { /* skip */ }
        start = -1
      }
    }
  }
  return objects
}

function stripAnsi(str: string) {
  return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '')
}

function parseOutput(chunks: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const raw = chunks.join('')
  const jsonObjects = extractJsonObjects(raw)

  if (jsonObjects.length > 0) {
    for (const obj of jsonObjects) {
      const msg = obj as Record<string, unknown>
      if (msg.type === 'system' || msg.type === 'rate_limit_event') continue
      if (msg.type === 'assistant') {
        const message = msg.message as Record<string, unknown> | undefined
        if (message?.content) {
          for (const block of message.content as Array<Record<string, unknown>>) {
            if (block.type === 'text' && typeof block.text === 'string') {
              const text = block.text.trim()
              if (text) blocks.push({ type: 'assistant', content: text })
            } else if (block.type === 'tool_use') {
              blocks.push({
                type: 'tool_use',
                content: `${String(block.name || 'tool')}${block.input ? '\n' + JSON.stringify(block.input, null, 2).slice(0, 500) : ''}`,
                collapsed: true,
              })
            }
          }
        }
      }
      if (msg.type === 'tool_result' || msg.type === 'content_block_delta') {
        const text = typeof msg.content === 'string' ? msg.content : typeof msg.text === 'string' ? msg.text : null
        if (text) blocks.push({ type: 'tool_result', content: text.slice(0, 2000), collapsed: true })
      }
      if (msg.type === 'result') {
        const result = typeof msg.result === 'string' ? msg.result.trim() : null
        if (result) blocks.push({ type: 'assistant', content: result })
        if (typeof msg.total_cost_usd === 'number') {
          blocks.push({ type: 'system', content: `$${(msg.total_cost_usd as number).toFixed(4)}` })
        }
      }
    }
    if (blocks.length > 0) return blocks
  }

  // Plain text fallback
  for (const line of stripAnsi(raw).split('\n')) {
    const t = line.trim()
    if (!t || /^[\s─═┌┐└┘│├┤┬┴┼]+$/.test(t) || /^\.{3,}$/.test(t)) continue
    if (t.match(/^(Error:|error:|ERR)/)) blocks.push({ type: 'error', content: t })
    else blocks.push({ type: 'assistant', content: t })
  }
  return blocks
}

const BLOCK_STYLES: Record<ParsedBlock['type'], string> = {
  user: 'text-tertiary/80',
  assistant: 'text-primary-container',
  tool_use: 'text-on-surface-muted/50',
  tool_result: 'text-on-surface-muted/40',
  system: 'text-secondary/50',
  error: 'text-error/80',
  log: 'text-on-surface-muted/30',
}

const BLOCK_LABELS: Partial<Record<ParsedBlock['type'], string>> = {
  tool_use: 'TOOL',
  tool_result: 'RESULT',
  error: 'ERR',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CCSessionBlock({ block }: { block: CCSessionBlockType }) {
  const [expanded, setExpanded] = useState(true)
  const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set())
  const outputRef = useRef<HTMLDivElement>(null)

  const session = useCortexStore(s => s.inlineSessions.get(block.sessionId))

  // Fetch historical logs (from DB, not WS — fills gaps on mount)
  const { data: logs } = useQuery({
    queryKey: ['ccLogs', block.sessionId],
    queryFn: () => getSessionLogs(block.sessionId, { limit: 500 }),
    enabled: !!block.sessionId,
  })

  const stop = useMutation({ mutationFn: () => stopSession(block.sessionId) })

  const allChunks = useMemo(() => [
    ...(logs?.logs.map((l: CCSessionLog) => l.chunk) ?? []),
    ...(session?.output ?? []),
  ], [logs, session?.output])

  const parsedBlocks = useMemo(() => parseOutput(allChunks), [allChunks])

  // Auto-scroll when new output arrives
  useEffect(() => {
    if (expanded && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [parsedBlocks.length, expanded])

  const status = session?.status ?? 'initializing'
  const isActive = status === 'running' || status === 'initializing'
  const isComplete = status === 'complete'
  const hasError = status === 'error'

  const statusIcon = isActive
    ? <Loader2 className="h-3 w-3 animate-spin text-primary" strokeWidth={1.75} />
    : isComplete
      ? <CheckCircle2 className="h-3 w-3 text-secondary" strokeWidth={1.75} />
      : hasError
        ? <XCircle className="h-3 w-3 text-error" strokeWidth={1.75} />
        : <Terminal className="h-3 w-3 text-on-surface-muted/50" strokeWidth={1.75} />

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className="rounded-2xl overflow-hidden border border-black/8 bg-[#0B0F14]/80"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
          {statusIcon}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-on-surface truncate">{block.title}</p>
          <div className="flex items-center gap-3 mt-0.5">
            {session?.started_at && (
              <span className="flex items-center gap-1 text-[10px] text-on-surface-muted/40 font-mono">
                <Clock className="h-2.5 w-2.5" strokeWidth={1.5} />
                {formatRelative(session.started_at)}
              </span>
            )}
            {session?.cc_cost_usd != null && session.cc_cost_usd > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-on-surface-muted/40 font-mono">
                <DollarSign className="h-2.5 w-2.5" strokeWidth={1.5} />
                {session.cc_cost_usd.toFixed(4)}
              </span>
            )}
            {session?.commit_sha && (
              <span className="flex items-center gap-1 text-[10px] text-secondary/50 font-mono">
                <GitBranch className="h-2.5 w-2.5" strokeWidth={1.5} />
                {session.commit_sha.slice(0, 7)}
              </span>
            )}
            {session?.deploy_status === 'deployed' && (
              <span className="flex items-center gap-1 text-[10px] text-tertiary/60 font-mono">
                <Rocket className="h-2.5 w-2.5" strokeWidth={1.5} />
                deployed
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); stop.mutate() }}
              className="flex items-center gap-1.5 rounded-lg bg-error/10 px-2.5 py-1 text-[11px] text-error hover:bg-error/20 transition-colors"
            >
              <Square className="h-2.5 w-2.5" strokeWidth={2} />
              Stop
            </button>
          )}
          <div className="text-on-surface-muted/30">
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.75} />
              : <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.75} />
            }
          </div>
        </div>
      </button>

      {/* Pipeline strip */}
      {session?.pipeline_stage && expanded && (
        <div className="border-t border-white/[0.04] px-5 py-2">
          <PipelineStrip stage={session.pipeline_stage} />
        </div>
      )}

      {/* Terminal output */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 90, damping: 22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/[0.04]">
              <div
                ref={outputRef}
                className="max-h-[45vh] min-h-[80px] overflow-y-auto px-5 py-4 font-mono text-xs leading-relaxed scrollbar-thin"
              >
                <AnimatePresence initial={false}>
                  {parsedBlocks.map((pb, i) => {
                    const isCollapsible = pb.collapsed
                    const isLineExpanded = expandedLines.has(i)
                    const label = BLOCK_LABELS[pb.type]
                    const lines = pb.content.split('\n')
                    const preview = lines[0].slice(0, 100)
                    const isLong = lines.length > 3 || pb.content.length > 180

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 3 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 22 }}
                        className={`mb-2 ${BLOCK_STYLES[pb.type]}`}
                      >
                        {label && (
                          <span className="mr-2 rounded-sm bg-white/5 px-1.5 py-0.5 text-[8px] uppercase tracking-widest opacity-70">
                            {label}
                          </span>
                        )}
                        {isCollapsible && isLong && !isLineExpanded ? (
                          <button
                            onClick={() => setExpandedLines(prev => { const n = new Set(prev); n.add(i); return n })}
                            className="inline-flex items-center gap-1 text-left opacity-60 hover:opacity-90"
                          >
                            <ChevronDown className="h-2.5 w-2.5 shrink-0" strokeWidth={1.75} />
                            <span className="truncate max-w-[40ch]">{preview}{pb.content.length > 100 ? '…' : ''}</span>
                          </button>
                        ) : isCollapsible && isLong && isLineExpanded ? (
                          <div>
                            <button
                              onClick={() => setExpandedLines(prev => { const n = new Set(prev); n.delete(i); return n })}
                              className="mb-1 inline-flex items-center gap-1 opacity-60 hover:opacity-90"
                            >
                              <ChevronUp className="h-2.5 w-2.5 shrink-0" strokeWidth={1.75} />
                              <span>collapse</span>
                            </button>
                            <pre className="whitespace-pre-wrap break-words">{pb.content}</pre>
                          </div>
                        ) : (
                          <pre className="whitespace-pre-wrap break-words">{pb.content}</pre>
                        )}
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {parsedBlocks.length === 0 && (
                  <div className="flex items-center gap-2 text-on-surface-muted/30">
                    {isActive
                      ? <><div className="h-1.5 w-1.5 rounded-full bg-primary/40 animate-pulse" /><span>Initialising…</span></>
                      : hasError
                        ? <span className="text-error/50">Session failed — no parseable output.</span>
                        : <span>No output.</span>
                    }
                  </div>
                )}

                {isActive && parsedBlocks.length > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-on-surface-muted/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 animate-pulse" />
                    <span className="text-[9px] uppercase tracking-widest">Live</span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Pipeline strip ───────────────────────────────────────────────────────────

const PIPELINE_STAGES = ['queued', 'context', 'executing', 'testing', 'reviewing', 'deploying', 'complete'] as const
type PipelineStage = typeof PIPELINE_STAGES[number]

function PipelineStrip({ stage }: { stage: string }) {
  const idx = PIPELINE_STAGES.indexOf(stage as PipelineStage)
  return (
    <div className="flex items-center gap-1">
      {PIPELINE_STAGES.map((s, i) => (
        <div key={s} className="flex items-center gap-1">
          <div className={`h-1 w-1 rounded-full transition-colors ${
            i < idx ? 'bg-secondary/60' : i === idx ? 'bg-primary/80' : 'bg-white/10'
          }`} />
          {i < PIPELINE_STAGES.length - 1 && (
            <div className={`h-px w-3 transition-colors ${i < idx ? 'bg-secondary/30' : 'bg-white/5'}`} />
          )}
        </div>
      ))}
      <span className="ml-2 text-[9px] uppercase tracking-widest text-on-surface-muted/30">{stage}</span>
    </div>
  )
}
