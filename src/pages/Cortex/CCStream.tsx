/**
 * CCStream — The Ambient Intelligence Surface.
 *
 * Green + gold. Futuristic. Alive.
 *
 * Tables render like holographic data grids.
 * Code blocks glow like terminal readouts.
 * Tool badges pulse like neural activity.
 * Links shimmer like gold filaments.
 *
 * The system speaks. You observe. Occasionally you approve.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, RotateCcw, Brain, ChevronDown,
  Mail, DollarSign, Zap, Activity,
  GitBranch, TrendingUp,
} from 'lucide-react'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MermaidBlock } from '@/components/MermaidBlock'
import { useOSSessionStore, type OSSessionMessage } from '@/store/osSessionStore'
import { sendOSMessage, restartOS, getTokenUsage, getOSStatus, recoverResponse } from '@/api/osSession'
import { getGmailStats } from '@/api/gmail'
import { getFinanceSummary } from '@/api/finance'
import { getActionStats } from '@/api/actions'
import { getMomentum } from '@/api/momentum'

// ─── Ghost prompts ──────────────────────────────────────────────────
const GHOST_PROMPTS = [
  'How\'s the business doing?',
  'Check all inboxes, what needs attention?',
  'Show me the CRM pipeline',
  'Draft replies to urgent emails',
  'What happened while I was away?',
  'Fix the bookkeeping, categorize everything',
  'Any pending code requests?',
  'What\'s on the calendar this week?',
]

function useGhostPrompt(): string {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % GHOST_PROMPTS.length), 7000)
    return () => clearInterval(t)
  }, [])
  return GHOST_PROMPTS[idx]
}

// ─── Chromatic Vitals — green+gold ambient data ─────────────────────

function ChromaticVital({ icon: Icon, value, label, color, glowColor, delay = 0 }: {
  icon: typeof Mail
  value: string | number
  label: string
  color: string
  glowColor: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay }}
      className="group relative flex items-center gap-2.5 rounded-2xl px-4 py-2.5 holo-border"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.40))`,
        boxShadow: `0 8px 24px -8px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.4)`,
        border: '1px solid rgba(255,255,255,0.50)',
        borderTopColor: 'rgba(255,255,255,0.70)',
      }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{
        background: `linear-gradient(135deg, ${color}20, ${color}08)`,
        boxShadow: `0 0 12px ${color}15`,
      }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold font-mono tabular-nums" style={{ color: '#151716' }}>
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-[0.08em] text-on-surface-muted/40 font-mono">{label}</p>
      </div>
    </motion.div>
  )
}

function AmbientVitals() {
  const { data: gmail } = useQuery({ queryKey: ['vitals-gmail'], queryFn: getGmailStats, staleTime: 30_000, retry: 1 })
  const { data: finance } = useQuery({ queryKey: ['vitals-finance'], queryFn: getFinanceSummary, staleTime: 30_000, retry: 1 })
  const { data: actions } = useQuery({ queryKey: ['vitals-actions'], queryFn: getActionStats, staleTime: 30_000, retry: 1 })
  const { data: momentum } = useQuery({ queryKey: ['vitals-momentum'], queryFn: getMomentum, staleTime: 30_000, retry: 1 })

  const fmtCurrency = (cents: number) => {
    const abs = Math.abs(cents / 100)
    return `$${abs >= 1000 ? (abs / 1000).toFixed(1) + 'k' : abs.toFixed(0)}`
  }

  // Green + gold palette for all vitals
  const GRN = '#1B7A3D'
  const GRN_GLOW = 'rgba(27,122,61,0.14)'
  const GLD = '#D97706'
  const GLD_GLOW = 'rgba(217,119,6,0.14)'
  const EMR = '#059669'
  const EMR_GLOW = 'rgba(5,150,105,0.12)'

  const vitals = useMemo(() => {
    const items: Array<{ icon: typeof Mail; value: string; label: string; color: string; glow: string }> = []

    if (gmail) {
      if (gmail.unread > 0) items.push({ icon: Mail, value: String(gmail.unread), label: 'unread', color: GRN, glow: GRN_GLOW })
      if (gmail.urgent > 0) items.push({ icon: Zap, value: String(gmail.urgent), label: 'urgent', color: GLD, glow: GLD_GLOW })
    }

    if (finance) {
      const rev = finance.income
      if (rev) items.push({ icon: DollarSign, value: fmtCurrency(rev), label: 'income', color: EMR, glow: EMR_GLOW })
    }

    if (actions) {
      if (actions.pending > 0) items.push({ icon: Activity, value: String(actions.pending), label: 'pending', color: GLD, glow: GLD_GLOW })
    }

    if (momentum) {
      const { summary, health } = momentum
      if (summary.sessions7d > 0) items.push({
        icon: GitBranch, value: `${summary.complete}/${summary.sessions7d}`, label: 'sessions', color: GRN, glow: GRN_GLOW
      })
      if (summary.successRate != null) items.push({
        icon: TrendingUp, value: `${Math.round(summary.successRate * 100)}%`, label: 'success', color: EMR, glow: EMR_GLOW
      })
      if (health?.ecodiaos?.activeCCSessions) items.push({
        icon: Brain, value: String(health.ecodiaos.activeCCSessions), label: 'active CC', color: GRN, glow: GRN_GLOW
      })
    }

    return items
  }, [gmail, finance, actions, momentum])

  if (vitals.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      className="flex flex-wrap gap-2.5 justify-center py-3"
    >
      {vitals.map((v, i) => (
        <ChromaticVital key={v.label} icon={v.icon} value={v.value} label={v.label} color={v.color} glowColor={v.glow} delay={i * 0.06} />
      ))}
    </motion.div>
  )
}

// ─── Action Proposals — gold accent, the system's decisions ─────────

function PendingActionsBanner() {
  const { data: actions } = useQuery({ queryKey: ['vitals-actions'], queryFn: getActionStats, staleTime: 30_000, retry: 1 })

  if (!actions || actions.pending === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.4 }}
      className="flex items-center gap-3 rounded-2xl px-5 py-3 mx-auto max-w-md"
      style={{
        background: 'linear-gradient(135deg, rgba(217,119,6,0.06), rgba(251,191,36,0.03))',
        border: '1px solid rgba(217,119,6,0.12)',
        boxShadow: '0 4px 20px -4px rgba(217,119,6,0.10)',
      }}
    >
      <motion.div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: '#F59E0B', boxShadow: '0 0 8px rgba(245,158,11,0.4)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-xs text-on-surface-variant">
        {actions.pending} action{actions.pending > 1 ? 's' : ''} waiting
        {actions.urgent > 0 && <span className="ml-1 font-medium" style={{ color: '#D97706' }}>&middot; {actions.urgent} urgent</span>}
      </span>
      <span className="text-[10px] text-on-surface-muted/25 ml-auto font-mono">ask cortex</span>
    </motion.div>
  )
}

// ─── Stream chunk parser ────────────────────────────────────────────

interface ParsedChunk {
  type: 'text' | 'tool_use' | 'tool_result' | 'thinking' | 'system' | 'unknown'
  content: string
  toolName?: string
}

function parseStreamChunks(chunks: string[]): ParsedChunk[] {
  const parsed: ParsedChunk[] = []
  for (const chunk of chunks) {
    try {
      const obj = JSON.parse(chunk)
      if (obj.type === 'assistant' && obj.message?.content) {
        for (const block of obj.message.content) {
          if (block.type === 'text') parsed.push({ type: 'text', content: block.text })
          if (block.type === 'tool_use') parsed.push({ type: 'tool_use', content: `Using ${block.name}`, toolName: block.name })
          if (block.type === 'thinking') parsed.push({ type: 'thinking', content: block.thinking || block.text || '' })
        }
      }
      if (obj.type === 'content_block_start' && obj.content_block) {
        if (obj.content_block.type === 'tool_use') {
          parsed.push({ type: 'tool_use', content: `Using ${obj.content_block.name}`, toolName: obj.content_block.name })
        }
      }
    } catch {
      if (chunk.trim()) parsed.push({ type: 'unknown', content: chunk.trim() })
    }
  }
  return parsed
}

// ─── Tool badges — green+gold neural activity indicators ────────────
// Every tool gets a green or gold accent — never blue.
// The tool name renders like a system identifier: monospace, glowing.

const TOOL_ACCENT: Record<string, { color: string; glow: string }> = {
  gmail:    { color: '#1B7A3D', glow: 'rgba(27,122,61,0.10)' },
  calendar: { color: '#D97706', glow: 'rgba(217,119,6,0.10)' },
  db:       { color: '#059669', glow: 'rgba(5,150,105,0.10)' },
  shell:    { color: '#D97706', glow: 'rgba(217,119,6,0.10)' },
  pm2:      { color: '#B45309', glow: 'rgba(180,83,9,0.10)' },
  linkedin: { color: '#1B7A3D', glow: 'rgba(27,122,61,0.10)' },
  drive:    { color: '#059669', glow: 'rgba(5,150,105,0.10)' },
  xero:     { color: '#D97706', glow: 'rgba(217,119,6,0.10)' },
  meta:     { color: '#1B7A3D', glow: 'rgba(27,122,61,0.10)' },
  vercel:   { color: '#059669', glow: 'rgba(5,150,105,0.10)' },
}

function getToolAccent(name?: string) {
  if (!name) return { color: '#1B7A3D', glow: 'rgba(27,122,61,0.08)' }
  const key = Object.keys(TOOL_ACCENT).find(k => name.toLowerCase().includes(k))
  return key ? TOOL_ACCENT[key] : { color: '#1B7A3D', glow: 'rgba(27,122,61,0.08)' }
}

// ─── Message renderers ──────────────────────────────────────────────

function UserMessage({ message }: { message: OSSessionMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 22 }}
      className="py-3"
    >
      <div className="rounded-2xl px-5 py-3.5" style={{
        background: 'linear-gradient(135deg, rgba(27,122,61,0.05), rgba(46,204,113,0.03))',
        border: '1px solid rgba(27,122,61,0.08)',
        boxShadow: '0 2px 12px -4px rgba(27,122,61,0.06)',
      }}>
        <p className="text-sm leading-relaxed text-on-surface font-medium">{message.content}</p>
      </div>
    </motion.div>
  )
}

function AssistantMessage({ message }: { message: OSSessionMessage }) {
  const chunks = message.chunks ? parseStreamChunks(message.chunks) : []
  const textContent = chunks.filter(c => c.type === 'text').map(c => c.content).join('\n\n')
  const toolUses = chunks.filter(c => c.type === 'tool_use')
  const thinkingBlocks = chunks.filter(c => c.type === 'thinking')
  const displayText = textContent || message.content

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.04 }}
      className="py-3 space-y-3"
    >
      {/* Thinking blocks — collapsible, green tint */}
      {thinkingBlocks.map((t, i) => (
        <ThinkingBlock key={`think-${i}`} content={t.content} />
      ))}

      {/* Tool badges — futuristic neural activity pills */}
      {toolUses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolUses.map((t, i) => {
            const accent = getToolAccent(t.toolName)
            return (
              <motion.div
                key={`tool-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18, delay: i * 0.03 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  background: `linear-gradient(135deg, ${accent.color}08, ${accent.color}04)`,
                  border: `1px solid ${accent.color}15`,
                  boxShadow: `0 2px 8px -2px ${accent.glow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                }}
              >
                {/* Pulse dot */}
                <motion.div
                  className="h-1 w-1 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accent.color, boxShadow: `0 0 4px ${accent.color}60` }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="text-[11px] font-mono tracking-wide" style={{ color: `${accent.color}cc` }}>
                  {t.toolName || t.content}
                </span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Response text — futuristic markdown rendering */}
      {displayText && (
        <div className="cortex-prose text-sm leading-[1.85] text-on-surface-variant">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({ className, children, ...props }) { const match = /language-(\w+)/.exec(className || ''); if (match?.[1] === 'mermaid') return <MermaidBlock code={String(children).replace(/\n$/, '')} />; return <code className={className} {...props}>{children}</code>; } }}>{displayText}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  )
}

function ThinkingBlock({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false)
  const preview = content.length > 120 ? content.slice(0, 120) + '...' : content

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(27,122,61,0.04), rgba(46,204,113,0.02))',
        border: '1px solid rgba(27,122,61,0.08)',
        boxShadow: '0 2px 12px -4px rgba(27,122,61,0.06)',
      }}
      layout
    >
      <button onClick={() => setExpanded(!expanded)} className="flex items-start gap-2.5 px-4 py-3 w-full text-left">
        <Brain className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" style={{ color: '#2ECC71' }} strokeWidth={1.75} />
        <span className="text-xs text-on-surface-muted/50 leading-relaxed flex-1">{expanded ? content : preview}</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <ChevronDown className="h-3 w-3 text-on-surface-muted/25 flex-shrink-0 mt-0.5" strokeWidth={2} />
        </motion.div>
      </button>
    </motion.div>
  )
}

// ─── Streaming indicator — green + gold breathing ───────────────────

function StreamingIndicator({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 space-y-3">
      {text && (
        <div className="cortex-prose text-sm leading-[1.85] text-on-surface-variant">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ code({ className, children, ...props }) { const match = /language-(\w+)/.exec(className || ''); if (match?.[1] === 'mermaid') return <MermaidBlock code={String(children).replace(/\n$/, '')} />; return <code className={className} {...props}>{children}</code>; } }}>{text}</ReactMarkdown>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          {[
            { color: '#1B7A3D', delay: 0 },
            { color: '#2ECC71', delay: 0.15 },
            { color: '#D97706', delay: 0.3 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: dot.color, boxShadow: `0 0 6px ${dot.color}50` }}
              animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <span className="text-[11px] text-on-surface-muted/30 font-mono tracking-wider">
          {text ? 'working' : 'thinking'}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Token usage — green-to-gold gradient bar ───────────────────────

function TokenBar() {
  const { data } = useQuery({ queryKey: ['os-tokens'], queryFn: getTokenUsage, staleTime: 15_000, retry: 1 })
  const compacting = useOSSessionStore(s => s.compacting)

  if (!data || data.total === 0) return null

  const pct = Math.min((data.total / data.threshold) * 100, 100)
  const isHigh = pct > 75

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-1">
      <div className="flex-1 h-0.5 rounded-full bg-on-surface-muted/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isHigh
              ? 'linear-gradient(90deg, #D97706, #EA580C)'
              : 'linear-gradient(90deg, #1B7A3D, #2ECC71)',
            boxShadow: isHigh
              ? '0 0 8px rgba(217,119,6,0.3)'
              : '0 0 8px rgba(46,204,113,0.2)',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        />
      </div>
      <span className="text-[9px] font-mono text-on-surface-muted/25 tabular-nums whitespace-nowrap">
        {compacting ? 'compacting...' : `${Math.round(pct)}%`}
      </span>
    </motion.div>
  )
}

// ─── Main CCStream ──────────────────────────────────────────────────

/** How many messages to show initially. Click "show earlier" to load more. */
const VISIBLE_BATCH = 30

export default function CCStream() {
  const [input, setInput] = useState('')
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const userScrolledUp = useRef(false)
  const allMessages = useOSSessionStore(s => s.messages)
  const status = useOSSessionStore(s => s.status)
  const streamText = useOSSessionStore(s => s.streamText)
  const addUserMessage = useOSSessionStore(s => s.addUserMessage)

  // Only render the most recent `visibleCount` messages
  const messages = useMemo(() => {
    if (allMessages.length <= visibleCount) return allMessages
    return allMessages.slice(-visibleCount)
  }, [allMessages, visibleCount])
  const hasEarlier = allMessages.length > visibleCount

  const ghostPrompt = useGhostPrompt()
  const canSend = input.trim().length > 0 && status !== 'streaming'

  // Track whether user has scrolled away from bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      userScrolledUp.current = distFromBottom > 80
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Auto-scroll only when user is near the bottom (or on new messages/status change)
  useEffect(() => {
    if (!userScrolledUp.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, status, streamText])

  // Always scroll down when the user sends a new message
  const prevMessageCount = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'user') {
        userScrolledUp.current = false
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    prevMessageCount.current = messages.length
  }, [messages])

  useEffect(() => { inputRef.current?.focus() }, [])

  // ─── Recovery: reconnect after tab close mid-turn ─────────────────
  // On mount, check if we had an in-flight request (lastUserMessageAt set).
  // If the last message is from the user with no assistant response, recover.
  useEffect(() => {
    const store = useOSSessionStore.getState()
    if (store.recoveryAttempted) return
    const { lastUserMessageAt, messages: msgs, streamText: existingStream, streamChunks: existingChunks } = store

    // Case 1: We have persisted streamChunks from a tab close mid-stream.
    // The WS is gone but we have partial data. Check backend status.
    // Case 2: Last message is user with no response — backend may have completed.
    const lastMsg = msgs[msgs.length - 1]
    const needsRecovery = lastUserMessageAt || (existingChunks.length > 0 && existingStream)
      || (lastMsg?.role === 'user' && msgs.filter(m => m.role === 'assistant').length < msgs.filter(m => m.role === 'user').length)

    if (!needsRecovery) return

    store.setRecoveryAttempted()

    // If we have partial stream data, show it immediately while we check backend
    if (existingStream && store.status !== 'streaming') {
      store.setStatus('streaming')
    }

    // Check backend status and recover
    ;(async () => {
      try {
        const backendStatus = await getOSStatus()

        if (backendStatus.active) {
          // Backend is still working — set streaming status, WS will pick up from here
          store.setStatus('streaming')
          return
        }

        // Backend finished (or idle). Try to recover the missed response.
        const sinceTs = lastUserMessageAt || lastMsg?.timestamp?.toISOString?.() || undefined
        const recovery = await recoverResponse(sinceTs ? String(sinceTs) : undefined)

        if (recovery.found && recovery.text) {
          // Clear any partial stream state first
          if (store.streamChunks.length > 0 || store.streamText) {
            // We have partial data — the recovered response is the complete version
            useOSSessionStore.setState({ streamChunks: [], streamText: '' })
          }
          store.injectRecoveredResponse(recovery.text, recovery.chunks)
        } else if (existingChunks.length > 0 || existingStream) {
          // No backend recovery but we have partial stream data — finalize what we have
          store.finalizeResponse()
        } else {
          // Nothing to recover — reset to idle
          store.setStatus('idle')
        }
      } catch {
        // Recovery failed — finalize any partial data we have
        if (existingChunks.length > 0 || existingStream) {
          store.finalizeResponse()
        } else {
          store.setStatus('idle')
        }
      }
    })()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    addUserMessage(text)
    try {
      const result = await sendOSMessage(text)
      const store = useOSSessionStore.getState()
      if (store.status === 'streaming') {
        // WebSocket didn't deliver os-session:complete — use HTTP response as fallback
        // Only inject text if WebSocket didn't already stream it via deltas
        if (result.text && !store.streamText) {
          store.appendStreamText(result.text)
        }
        store.finalizeResponse()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      useOSSessionStore.getState().finalizeResponse()
      useOSSessionStore.getState().setStatus('error')
      useOSSessionStore.setState(state => ({
        messages: [...state.messages, {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: `Connection error: ${msg}`,
          timestamp: new Date(),
        }],
      }))
    }
  }, [input, addUserMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  const handleRestart = useCallback(async () => {
    await restartOS()
    useOSSessionStore.getState().clearMessages()
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div className="relative flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">
          {/* Ambient welcome — green + gold presence */}
          {!hasMessages && status !== 'streaming' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              className="flex flex-col items-center pt-[10vh] pb-4"
            >
              <span className="text-label-md font-mono uppercase tracking-[0.3em] text-on-surface-muted/25">
                Ambient Intelligence
              </span>
              <h1 className="mt-3 font-display text-display-lg font-light text-on-surface">
                Eco<span className="bg-gradient-to-r from-primary to-gold-bright bg-clip-text text-transparent font-normal">dia</span>OS
              </h1>

              {/* The Breath — green + gold */}
              <div className="mt-8 mb-6 flex items-center gap-2.5">
                {[
                  { color: '#1B7A3D', shadow: 'rgba(27,122,61,0.5)', delay: 0 },
                  { color: '#2ECC71', shadow: 'rgba(46,204,113,0.4)', delay: 0.25 },
                  { color: '#F59E0B', shadow: 'rgba(245,158,11,0.4)', delay: 0.5 },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{ backgroundColor: b.color, width: 3, height: 3, boxShadow: `0 0 8px ${b.shadow}` }}
                    animate={{ scale: [1, 2, 1], opacity: [0.3, 0.9, 0.3] }}
                    transition={{ duration: 3, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
                  />
                ))}
              </div>

              <AmbientVitals />
              <div className="mt-3 w-full">
                <PendingActionsBanner />
              </div>
            </motion.div>
          )}

          {/* Conversation stream */}
          {hasMessages && (
            <div className="pb-8 pt-4 space-y-1">
              <AmbientVitals />
              {hasEarlier && (
                <button
                  onClick={() => setVisibleCount(c => c + VISIBLE_BATCH)}
                  className="w-full text-center py-2 text-xs text-on-surface-muted/30 hover:text-on-surface-muted/50 transition-colors font-mono"
                >
                  show {Math.min(VISIBLE_BATCH, allMessages.length - visibleCount)} earlier messages
                </button>
              )}
              <AnimatePresence initial={false}>
                {messages.map(msg =>
                  msg.role === 'user'
                    ? <UserMessage key={msg.id} message={msg} />
                    : <AssistantMessage key={msg.id} message={msg} />
                )}
              </AnimatePresence>
            </div>
          )}

          {status === 'streaming' && <StreamingIndicator text={streamText} />}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input — the whisper bar */}
      <SpatialLayer z={20}>
        <div className="mx-auto max-w-3xl px-6 py-4">
          <TokenBar />
          <div className="mt-2 rounded-2xl transition-all chromatic-focus"
            style={{
              background: 'rgba(255, 255, 255, 0.68)',
              border: '1px solid rgba(255, 255, 255, 0.55)',
              borderTopColor: 'rgba(255, 255, 255, 0.80)',
              boxShadow: '0 20px 48px -12px rgba(27,122,61,0.06), 0 8px 20px -8px rgba(217,119,6,0.02), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            <div className="flex items-end gap-3 px-5 py-4">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={ghostPrompt}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-on-surface placeholder-on-surface-muted/25 outline-none leading-relaxed"
                style={{ maxHeight: 200 }}
              />
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <motion.button
                    onClick={handleRestart}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-on-surface-muted/25 hover:text-on-surface-muted/50 hover:bg-on-surface-muted/[0.04] transition-all"
                    title="New session"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </motion.button>
                )}
                <motion.button
                  onClick={handleSend}
                  disabled={!canSend}
                  whileTap={canSend ? { scale: 0.92 } : {}}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all disabled:opacity-0 disabled:scale-90"
                  style={{
                    background: canSend ? 'linear-gradient(135deg, #1B7A3D, #2ECC71)' : 'transparent',
                    boxShadow: canSend ? '0 4px 16px -4px rgba(46,204,113,0.35), 0 0 12px rgba(46,204,113,0.15)' : 'none',
                    color: canSend ? 'white' : 'rgba(27,122,61,0.3)',
                  }}
                >
                  <ArrowUp className="h-4 w-4" strokeWidth={2} />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </SpatialLayer>
    </div>
  )
}
