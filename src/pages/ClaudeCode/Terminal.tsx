import { useEffect, useRef, useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSessionLogs, sendMessage, stopSession } from '@/api/claudeCode'
import { useCCSession } from '@/hooks/useCCSession'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { CCSession, CCSessionLog } from '@/types/claudeCode'
import { Send, Square, ChevronDown, ChevronUp, Terminal, DollarSign, Clock, GitBranch, Shield, Rocket, CheckCircle2, XCircle, FileCode } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { motion, AnimatePresence } from 'framer-motion'
import { formatRelative } from '@/lib/utils'

interface TerminalProps {
  session: CCSession
}

interface ParsedBlock {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result' | 'system' | 'error' | 'log'
  content: string
  collapsed?: boolean
}

/**
 * Extract JSON objects from raw NDJSON chunks.
 * Claude Code streams output as concatenated JSON - no newlines between them.
 * e.g. {"type":"system",...}{"type":"assistant",...}{"type":"result",...}
 */
function extractJsonObjects(raw: string): unknown[] {
  const objects: unknown[] = []
  let depth = 0
  let start = -1

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (ch === '{') {
      if (depth === 0) start = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && start !== -1) {
        try {
          objects.push(JSON.parse(raw.slice(start, i + 1)))
        } catch {
          // malformed - skip
        }
        start = -1
      }
    }
  }
  return objects
}

/** Strip ANSI escape codes */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '').replace(/\[[\d;]*m/g, '')
}

/** Parse raw chunks into meaningful blocks, filtering noise */
function parseOutput(chunks: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const raw = chunks.join('')

  // Try to parse as NDJSON first (Claude Code streaming format)
  const jsonObjects = extractJsonObjects(raw)

  if (jsonObjects.length > 0) {
    for (const obj of jsonObjects) {
      const msg = obj as Record<string, unknown>

      // Skip system init, rate limits, and other noise
      if (msg.type === 'system') continue
      if (msg.type === 'rate_limit_event') continue

      // Assistant messages - the core content
      if (msg.type === 'assistant') {
        const message = msg.message as Record<string, unknown> | undefined
        if (message?.content) {
          const contentArr = message.content as Array<Record<string, unknown>>
          for (const block of contentArr) {
            if (block.type === 'text' && typeof block.text === 'string') {
              const text = block.text.trim()
              if (text) blocks.push({ type: 'assistant', content: text })
            } else if (block.type === 'tool_use') {
              const toolName = String(block.name || 'tool')
              const toolInput = block.input
                ? JSON.stringify(block.input, null, 2).slice(0, 500)
                : ''
              blocks.push({
                type: 'tool_use',
                content: `${toolName}${toolInput ? '\n' + toolInput : ''}`,
                collapsed: true,
              })
            }
          }
        }
      }

      // Tool results
      if (msg.type === 'tool_result' || msg.type === 'content_block_delta') {
        const text = typeof msg.content === 'string'
          ? msg.content
          : typeof msg.text === 'string'
            ? msg.text
            : null
        if (text) {
          blocks.push({ type: 'tool_result', content: text.slice(0, 2000), collapsed: true })
        }
      }

      // Result summary - session complete
      if (msg.type === 'result') {
        const result = typeof msg.result === 'string' ? msg.result.trim() : null
        if (result) {
          blocks.push({ type: 'assistant', content: result })
        }
        const cost = msg.total_cost_usd
        if (typeof cost === 'number') {
          blocks.push({ type: 'system', content: `Session cost: $${cost.toFixed(4)}` })
        }
      }

      // User messages (if echoed back)
      if (msg.type === 'user' || msg.type === 'human') {
        const text = typeof msg.content === 'string'
          ? msg.content
          : typeof msg.message === 'string'
            ? msg.message
            : null
        if (text) blocks.push({ type: 'user', content: text })
      }
    }

    // If we got JSON objects, return what we extracted
    if (blocks.length > 0) return blocks
  }

  // Fallback: plain text parsing (non-JSON output)
  const lines = stripAnsi(raw).split('\n')
  let currentBlock: ParsedBlock | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip box-drawing characters, bare ANSI, dots
    if (/^[\s─═┌┐└┘│├┤┬┴┼]+$/.test(trimmed)) continue
    if (/^\.{3,}$/.test(trimmed)) continue

    if (trimmed.startsWith('> ') || trimmed.startsWith('Human:') || trimmed.startsWith('User:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'user', content: trimmed.replace(/^(> |Human: |User: )/, '') }
    } else if (trimmed.startsWith('Assistant:') || trimmed.startsWith('Claude:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'assistant', content: trimmed.replace(/^(Assistant: |Claude: )/, '') }
    } else if (trimmed.match(/^(Read|Write|Edit|Bash|Grep|Glob|Tool:|Using tool:)/)) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'tool_use', content: trimmed, collapsed: true }
    } else if (trimmed.startsWith('Result:') || trimmed.startsWith('Tool result:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'tool_result', content: trimmed.replace(/^(Result: |Tool result: )/, ''), collapsed: true }
    } else if (trimmed.match(/^(Error:|error:|ERR)/)) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'error', content: trimmed }
    } else if (currentBlock) {
      currentBlock.content += '\n' + line
    } else {
      currentBlock = { type: 'assistant', content: trimmed }
    }
  }
  if (currentBlock) blocks.push(currentBlock)

  return blocks
}

const BLOCK_STYLES: Record<ParsedBlock['type'], string> = {
  user: 'text-tertiary/80',
  assistant: 'text-primary-container',
  tool_use: 'text-on-surface-muted/50',
  tool_result: 'text-on-surface-muted/40',
  system: 'text-on-surface-muted/30',
  error: 'text-error/80',
  log: 'text-on-surface-muted/30',
}

const BLOCK_LABELS: Partial<Record<ParsedBlock['type'], string>> = {
  tool_use: 'TOOL',
  tool_result: 'RESULT',
  error: 'ERROR',
}

const glide = { type: 'spring' as const, stiffness: 90, damping: 22 }

export function CCTerminal({ session }: TerminalProps) {
  const [input, setInput] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)
  const { output } = useCCSession(session.id)
  const [expandedBlocks, setExpandedBlocks] = useState<Set<number>>(new Set())

  const { data: logs } = useQuery({
    queryKey: ['ccLogs', session.id],
    queryFn: () => getSessionLogs(session.id, { limit: 500 }),
  })

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(session.id, content),
  })

  const stop = useMutation({
    mutationFn: () => stopSession(session.id),
  })

  const allChunks = useMemo(() => [
    ...(logs?.logs.map((l: CCSessionLog) => l.chunk) ?? []),
    ...output,
  ], [logs, output])

  const blocks = useMemo(() => parseOutput(allChunks), [allChunks])

  const toggleBlock = (i: number) => {
    setExpandedBlocks(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [blocks.length])

  const isActive = session.status === 'running' || session.status === 'awaiting_input'
  const isComplete = session.status === 'complete'
  const hasError = session.status === 'error'

  return (
    <div className="space-y-5">
      {/* Session header - glass bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/8">
            <Terminal className="h-3.5 w-3.5 text-primary" strokeWidth={1.75} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge status={session.status} />
              {session.project_name && (
                <span className="text-sm text-on-surface-variant">{session.project_name}</span>
              )}
            </div>
            <div className="flex items-center gap-3 text-label-sm text-on-surface-muted/50">
              <span className="flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" strokeWidth={1.75} />
                {formatRelative(session.started_at)}
              </span>
              {session.cc_cost_usd != null && session.cc_cost_usd > 0 && (
                <span className="flex items-center gap-1 font-mono">
                  <DollarSign className="h-2.5 w-2.5" strokeWidth={1.75} />
                  {session.cc_cost_usd.toFixed(4)}
                </span>
              )}
            </div>
          </div>
        </div>

        {isActive && (
          <button
            onClick={() => stop.mutate()}
            className="flex items-center gap-2 rounded-xl bg-error/10 px-4 py-2.5 text-sm text-error hover:bg-error/20"
          >
            <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
            Stop
          </button>
        )}
      </div>

      {/* Pipeline stage tracker */}
      {session.pipeline_stage && (
        <PipelineTracker stage={session.pipeline_stage} confidence={session.confidence_score} filesChanged={session.files_changed} commitSha={session.commit_sha} deployStatus={session.deploy_status} />
      )}

      {/* Prompt display */}
      <div className="rounded-2xl bg-primary/5 px-6 py-4">
        <span className="text-label-sm uppercase tracking-wide text-primary/50">Initial Prompt</span>
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{session.initial_prompt}</p>
      </div>

      {/* Terminal output - elevated glass with dark interior */}
      <div style={{ transformStyle: 'flat' }}>
        <GlassPanel depth="elevated" className="overflow-hidden">
          <div
            ref={outputRef}
            className="max-h-[60vh] min-h-[200px] overflow-y-auto bg-[#0B0F14]/95 px-6 py-5 font-mono text-sm leading-relaxed"
          >
            <AnimatePresence initial={false}>
              {blocks.map((block, i) => {
                const isCollapsible = block.collapsed
                const isExpanded = expandedBlocks.has(i)
                const label = BLOCK_LABELS[block.type]
                const lines = block.content.split('\n')
                const preview = lines[0].slice(0, 120)
                const isLong = lines.length > 3 || block.content.length > 200

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.01 }}
                    className={`mb-3 ${BLOCK_STYLES[block.type]}`}
                  >
                    {label && (
                      <span className="mr-2 rounded-full bg-white/5 px-2 py-0.5 text-[9px] uppercase tracking-widest">
                        {label}
                      </span>
                    )}

                    {isCollapsible && isLong && !isExpanded ? (
                      <button
                        onClick={() => toggleBlock(i)}
                        className="group inline-flex items-center gap-1.5 text-left hover:text-primary-container/70"
                      >
                        <ChevronDown className="h-3 w-3 shrink-0 opacity-40 group-hover:opacity-70" strokeWidth={1.75} />
                        <span className="truncate opacity-60">{preview}{block.content.length > 120 ? '...' : ''}</span>
                      </button>
                    ) : isCollapsible && isLong && isExpanded ? (
                      <div>
                        <button
                          onClick={() => toggleBlock(i)}
                          className="mb-1 inline-flex items-center gap-1.5 text-left hover:text-primary-container/70"
                        >
                          <ChevronUp className="h-3 w-3 shrink-0 opacity-40" strokeWidth={1.75} />
                          <span className="opacity-60">Collapse</span>
                        </button>
                        <pre className="whitespace-pre-wrap break-words">{block.content}</pre>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap break-words">{block.content}</pre>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {blocks.length === 0 && (
              <div className="flex items-center gap-2 text-on-surface-muted/30">
                {isActive && (
                  <div className="h-2 w-2 rounded-full bg-primary/30 animate-pulse-glow" />
                )}
                <span>{isActive ? 'Processing...' : 'Awaiting output...'}</span>
              </div>
            )}

            {isActive && blocks.length > 0 && (
              <div className="mt-2 flex items-center gap-2 text-on-surface-muted/20">
                <div className="h-1.5 w-1.5 rounded-full bg-secondary/40 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest">Live</span>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* Error display */}
      {hasError && session.error_message && (
        <div className="rounded-2xl bg-error/5 px-6 py-4">
          <span className="text-label-sm uppercase tracking-wide text-error/50">Error</span>
          <p className="mt-1 font-mono text-sm text-error/80">{session.error_message}</p>
        </div>
      )}

      {/* Completion summary with files + confidence */}
      {isComplete && (
        <div className="rounded-2xl bg-secondary/5 px-6 py-4">
          <span className="text-label-sm uppercase tracking-wide text-secondary/50">Session Complete</span>
          <div className="mt-1 flex flex-wrap items-center gap-4 text-sm text-on-surface-muted">
            {session.completed_at && <span>Completed {formatRelative(session.completed_at)}</span>}
            {session.cc_cost_usd != null && <span className="font-mono">${session.cc_cost_usd.toFixed(4)}</span>}
            {session.confidence_score != null && (
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" strokeWidth={1.75} />
                {(session.confidence_score * 100).toFixed(0)}% confidence
              </span>
            )}
            {session.commit_sha && (
              <span className="flex items-center gap-1 font-mono text-xs">
                <GitBranch className="h-3 w-3" strokeWidth={1.75} />
                {session.commit_sha.slice(0, 7)}
              </span>
            )}
          </div>
          {session.files_changed && session.files_changed.length > 0 && (
            <div className="mt-3">
              <span className="text-label-sm uppercase tracking-wide text-secondary/40">Files Changed</span>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {session.files_changed.map(f => (
                  <span key={f} className="inline-flex items-center gap-1 rounded-lg bg-secondary/8 px-2 py-0.5 font-mono text-[11px] text-secondary/70">
                    <FileCode className="h-2.5 w-2.5" strokeWidth={1.75} />
                    {f.split('/').pop()}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input - always visible when session is active */}
      {isActive && (
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={glide}
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) {
              send.mutate(input)
              setInput('')
            }
          }}
          className="flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={session.status === 'awaiting_input' ? 'Claude is waiting for your input...' : 'Send a follow-up message...'}
            className="flex-1 rounded-xl bg-surface-container-low px-5 py-3 font-mono text-sm text-on-surface placeholder-on-surface-muted outline-none focus:bg-surface-container-lowest"
            autoFocus={session.status === 'awaiting_input'}
          />
          <button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
            Send
          </button>
        </motion.form>
      )}
    </div>
  )
}

// ─── Pipeline Stage Tracker ────────────────────────────────────────────

const PIPELINE_STAGES = [
  { key: 'queued', label: 'Queued', icon: Clock },
  { key: 'context', label: 'Context', icon: FileCode },
  { key: 'executing', label: 'Executing', icon: Terminal },
  { key: 'testing', label: 'Testing', icon: Shield },
  { key: 'reviewing', label: 'Review', icon: CheckCircle2 },
  { key: 'deploying', label: 'Deploy', icon: Rocket },
] as const

function PipelineTracker({ stage, confidence, filesChanged, commitSha, deployStatus }: {
  stage: string
  confidence: number | null
  filesChanged: string[] | null
  commitSha: string | null
  deployStatus: string | null
}) {
  const isFailed = stage === 'failed'
  const isComplete = stage === 'complete'
  const activeIndex = PIPELINE_STAGES.findIndex(s => s.key === stage)

  return (
    <div className="rounded-2xl bg-white/40 px-6 py-4">
      <div className="flex items-center gap-1.5 overflow-x-auto">
        {PIPELINE_STAGES.map((s, i) => {
          const Icon = s.icon
          const isPast = isComplete || activeIndex > i
          const isCurrent = !isComplete && !isFailed && activeIndex === i
          return (
            <div key={s.key} className="flex items-center gap-1.5">
              {i > 0 && (
                <div className={`h-px w-4 sm:w-8 transition-colors ${isPast ? 'bg-secondary/40' : 'bg-on-surface-muted/10'}`} />
              )}
              <div className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors ${
                isCurrent ? 'bg-primary/10 text-primary' :
                isPast ? 'text-secondary/60' :
                isFailed && activeIndex === i ? 'bg-error/8 text-error' :
                'text-on-surface-muted/25'
              }`}>
                {isFailed && activeIndex === i ? (
                  <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : isPast ? (
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'animate-pulse' : ''}`} strokeWidth={1.75} />
                )}
                <span className="hidden text-[11px] font-medium uppercase tracking-wider sm:inline">{s.label}</span>
              </div>
            </div>
          )
        })}

        {/* Terminal state */}
        <div className="flex items-center gap-1.5">
          <div className={`h-px w-4 sm:w-8 ${isComplete ? 'bg-secondary/40' : isFailed ? 'bg-error/20' : 'bg-on-surface-muted/10'}`} />
          <div className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 ${
            isComplete ? 'bg-secondary/10 text-secondary' :
            isFailed ? 'bg-error/8 text-error' :
            'text-on-surface-muted/25'
          }`}>
            {isComplete ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.75} /> :
             isFailed ? <XCircle className="h-3.5 w-3.5" strokeWidth={1.75} /> :
             <Rocket className="h-3.5 w-3.5" strokeWidth={1.75} />}
            <span className="hidden text-[11px] font-medium uppercase tracking-wider sm:inline">
              {isComplete ? 'Done' : isFailed ? 'Failed' : 'Done'}
            </span>
          </div>
        </div>
      </div>

      {/* Metadata row */}
      <div className="mt-3 flex flex-wrap items-center gap-4 text-[11px] text-on-surface-muted/50">
        {confidence != null && (
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" strokeWidth={1.75} />
            {(confidence * 100).toFixed(0)}% confidence
          </span>
        )}
        {filesChanged && filesChanged.length > 0 && (
          <span className="flex items-center gap-1">
            <FileCode className="h-3 w-3" strokeWidth={1.75} />
            {filesChanged.length} files changed
          </span>
        )}
        {commitSha && (
          <span className="flex items-center gap-1 font-mono">
            <GitBranch className="h-3 w-3" strokeWidth={1.75} />
            {commitSha.slice(0, 7)}
          </span>
        )}
        {deployStatus && (
          <span className={`flex items-center gap-1 ${deployStatus === 'deployed' ? 'text-secondary/60' : deployStatus === 'failed' ? 'text-error/60' : ''}`}>
            <Rocket className="h-3 w-3" strokeWidth={1.75} />
            {deployStatus}
          </span>
        )}
      </div>
    </div>
  )
}
