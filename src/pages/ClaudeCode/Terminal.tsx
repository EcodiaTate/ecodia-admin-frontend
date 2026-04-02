import { useEffect, useRef, useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSessionLogs, sendMessage, stopSession } from '@/api/claudeCode'
import { useCCSession } from '@/hooks/useCCSession'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { CCSession, CCSessionLog } from '@/types/claudeCode'
import { Send, Square, ChevronDown, ChevronUp, Terminal, DollarSign, Clock } from 'lucide-react'
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

/** Parse raw chunks into meaningful blocks, filtering noise */
function parseOutput(chunks: string[]): ParsedBlock[] {
  const blocks: ParsedBlock[] = []
  const raw = chunks.join('')

  // Split on double newlines or known markers
  const lines = raw.split('\n')
  let currentBlock: ParsedBlock | null = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    // Skip pure noise: progress bars, blank lines, ANSI sequences
    if (/^[\s─═┌┐└┘│├┤┬┴┼]+$/.test(trimmed)) continue
    if (/^\[[\d;]*m$/.test(trimmed)) continue
    if (/^\.{3,}$/.test(trimmed)) continue

    // Detect block types from Claude Code output patterns
    if (trimmed.startsWith('> ') || trimmed.startsWith('Human:') || trimmed.startsWith('User:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'user', content: trimmed.replace(/^(> |Human: |User: )/, '') }
    } else if (trimmed.startsWith('Assistant:') || trimmed.startsWith('Claude:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'assistant', content: trimmed.replace(/^(Assistant: |Claude: )/, '') }
    } else if (trimmed.startsWith('Tool:') || trimmed.startsWith('Using tool:') || trimmed.match(/^(Read|Write|Edit|Bash|Grep|Glob)\s/)) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'tool_use', content: trimmed, collapsed: true }
    } else if (trimmed.startsWith('Result:') || trimmed.startsWith('Tool result:')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'tool_result', content: trimmed.replace(/^(Result: |Tool result: )/, ''), collapsed: true }
    } else if (trimmed.startsWith('Error:') || trimmed.startsWith('error:') || trimmed.startsWith('ERR')) {
      if (currentBlock) blocks.push(currentBlock)
      currentBlock = { type: 'error', content: trimmed }
    } else if (currentBlock) {
      // Append to current block
      currentBlock.content += '\n' + line
    } else {
      // Default: treat as assistant output (the main content)
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
      {/* Session header — glass bar */}
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

      {/* Prompt display */}
      <div className="rounded-2xl bg-primary/5 px-6 py-4">
        <span className="text-label-sm uppercase tracking-wide text-primary/50">Initial Prompt</span>
        <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">{session.initial_prompt}</p>
      </div>

      {/* Terminal output — elevated glass with dark interior */}
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

      {/* Completion summary */}
      {isComplete && (
        <div className="rounded-2xl bg-secondary/5 px-6 py-4">
          <span className="text-label-sm uppercase tracking-wide text-secondary/50">Session Complete</span>
          <div className="mt-1 flex items-center gap-4 text-sm text-on-surface-muted">
            {session.completed_at && <span>Completed {formatRelative(session.completed_at)}</span>}
            {session.cc_cost_usd != null && <span className="font-mono">${session.cc_cost_usd.toFixed(4)}</span>}
          </div>
        </div>
      )}

      {/* Input — always visible when session is active */}
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
