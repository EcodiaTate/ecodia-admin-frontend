/**
 * CCStream — The Ambient Intelligence Surface.
 *
 * Not a chatbot. An awareness field.
 *
 * Top: Chromatic Vitals — live data that floats to you (finance, email, CRM, sessions).
 * Middle: The River — outcome stream from the OS mind.
 * Bottom: A whisper input — speak when you want, but everything arrives anyway.
 *
 * Design: futuristic, richly coloured, visually lavish.
 * Philosophy: outcomes and answers, not questions and forms.
 */
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, RotateCcw, Brain, Wrench, ChevronDown,
  Mail, DollarSign, Zap, Activity,
  GitBranch, TrendingUp,
} from 'lucide-react'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useOSSessionStore, type OSSessionMessage } from '@/store/osSessionStore'
import { sendOSMessage, restartOS, getTokenUsage } from '@/api/osSession'
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

// ─── Chromatic Vitals — ambient data that surfaces automatically ────

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
      className="group relative flex items-center gap-2.5 rounded-2xl px-4 py-2.5"
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.40))`,
        boxShadow: `0 8px 24px -8px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.4)`,
        border: '1px solid rgba(255,255,255,0.50)',
        borderTopColor: 'rgba(255,255,255,0.70)',
      }}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{
        background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold font-mono tabular-nums" style={{ color: '#151716' }}>
          {value}
        </p>
        <p className="text-[10px] uppercase tracking-[0.08em] text-on-surface-muted/40">{label}</p>
      </div>
      {/* Subtle chromatic glow on hover */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ boxShadow: `0 0 24px ${glowColor}` }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.4 }}
      />
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

  const vitals = useMemo(() => {
    const items: Array<{ icon: typeof Mail; value: string; label: string; color: string; glow: string }> = []

    if (gmail) {
      const total = gmail.unread || 0
      if (total > 0) items.push({ icon: Mail, value: String(total), label: 'unread', color: '#0891B2', glow: 'rgba(8,145,178,0.12)' })
      if (gmail.urgent > 0) items.push({ icon: Zap, value: String(gmail.urgent), label: 'urgent', color: '#E11D48', glow: 'rgba(225,29,72,0.12)' })
    }

    if (finance) {
      const rev = finance.income
      if (rev) items.push({ icon: DollarSign, value: fmtCurrency(rev), label: 'income', color: '#0D7C5A', glow: 'rgba(13,124,90,0.12)' })
    }

    if (actions) {
      if (actions.pending > 0) items.push({ icon: Activity, value: String(actions.pending), label: 'pending', color: '#D97706', glow: 'rgba(217,119,6,0.12)' })
    }

    if (momentum) {
      const { summary, health } = momentum
      if (summary.sessions7d > 0) items.push({
        icon: GitBranch, value: `${summary.complete}/${summary.sessions7d}`, label: 'sessions', color: '#7C3AED', glow: 'rgba(124,58,237,0.12)'
      })
      if (summary.successRate != null) items.push({
        icon: TrendingUp, value: `${Math.round(summary.successRate * 100)}%`, label: 'success', color: '#0D7C5A', glow: 'rgba(13,124,90,0.10)'
      })
      if (health?.ecodiaos?.activeCCSessions) items.push({
        icon: Brain, value: String(health.ecodiaos.activeCCSessions), label: 'active CC', color: '#0891B2', glow: 'rgba(8,145,178,0.10)'
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

// ─── Action Proposals — the system's decisions, waiting for a nod ───

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
        background: 'linear-gradient(135deg, rgba(217,119,6,0.06), rgba(251,191,36,0.04))',
        border: '1px solid rgba(217,119,6,0.10)',
        boxShadow: '0 4px 16px -4px rgba(217,119,6,0.08)',
      }}
    >
      <motion.div
        className="h-2 w-2 rounded-full bg-gold"
        animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-xs text-on-surface-variant">
        {actions.pending} action{actions.pending > 1 ? 's' : ''} waiting
        {actions.urgent > 0 && <span className="ml-1 text-rose-DEFAULT font-medium">&middot; {actions.urgent} urgent</span>}
      </span>
      <span className="text-[10px] text-on-surface-muted/30 ml-auto">ask Cortex to show them</span>
    </motion.div>
  )
}

// ─── Stream chunk parser (extracts displayable content from NDJSON) ──

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

// ─── Tool use badge — chromatic pill showing what the OS is doing ────

const TOOL_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  gmail: { bg: 'rgba(8,145,178,0.06)', text: 'rgba(8,145,178,0.70)', glow: 'rgba(8,145,178,0.08)' },
  calendar: { bg: 'rgba(124,58,237,0.06)', text: 'rgba(124,58,237,0.70)', glow: 'rgba(124,58,237,0.08)' },
  db: { bg: 'rgba(13,124,90,0.06)', text: 'rgba(13,124,90,0.70)', glow: 'rgba(13,124,90,0.08)' },
  shell: { bg: 'rgba(217,119,6,0.06)', text: 'rgba(217,119,6,0.70)', glow: 'rgba(217,119,6,0.08)' },
  pm2: { bg: 'rgba(225,29,72,0.06)', text: 'rgba(225,29,72,0.70)', glow: 'rgba(225,29,72,0.08)' },
  linkedin: { bg: 'rgba(8,145,178,0.06)', text: 'rgba(8,145,178,0.70)', glow: 'rgba(8,145,178,0.08)' },
}

function getToolColor(name?: string) {
  if (!name) return { bg: 'rgba(13,124,90,0.04)', text: 'rgba(13,124,90,0.55)', glow: 'rgba(13,124,90,0.06)' }
  const key = Object.keys(TOOL_COLORS).find(k => name.toLowerCase().includes(k))
  return key ? TOOL_COLORS[key] : { bg: 'rgba(13,124,90,0.04)', text: 'rgba(13,124,90,0.55)', glow: 'rgba(13,124,90,0.06)' }
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
        background: 'linear-gradient(135deg, rgba(13,124,90,0.06), rgba(8,145,178,0.03))',
        border: '1px solid rgba(13,124,90,0.08)',
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
      {/* Thinking blocks (collapsible) */}
      {thinkingBlocks.map((t, i) => (
        <ThinkingBlock key={`think-${i}`} content={t.content} />
      ))}

      {/* Tool use indicators — chromatic pills */}
      {toolUses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolUses.map((t, i) => {
            const tc = getToolColor(t.toolName)
            return (
              <motion.div
                key={`tool-${i}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, damping: 18, delay: i * 0.03 }}
                className="flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{ background: tc.bg, boxShadow: `0 2px 8px -2px ${tc.glow}` }}
              >
                <Wrench className="h-3 w-3" style={{ color: tc.text }} strokeWidth={1.75} />
                <span className="text-[11px] font-mono" style={{ color: tc.text }}>{t.toolName || t.content}</span>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Text response — rich markdown with chromatic code blocks */}
      {displayText && (
        <div className="text-sm leading-[1.85] text-on-surface-variant
          [&_p]:my-0 [&_p+p]:mt-3
          [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5
          [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5
          [&_strong]:text-on-surface [&_strong]:font-semibold
          [&_code]:rounded-lg [&_code]:bg-primary/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.78em] [&_code]:text-primary
          [&_pre]:rounded-2xl [&_pre]:bg-on-surface/[0.03] [&_pre]:p-4 [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-on-surface-variant
          [&_table]:w-full [&_table]:my-3
          [&_th]:text-left [&_th]:text-[11px] [&_th]:font-mono [&_th]:uppercase [&_th]:tracking-wider [&_th]:text-on-surface-muted/50 [&_th]:pb-2 [&_th]:border-b [&_th]:border-primary/[0.06]
          [&_td]:text-xs [&_td]:py-2 [&_td]:pr-4 [&_td]:border-b [&_td]:border-primary/[0.03]
          [&_h1]:text-lg [&_h1]:font-display [&_h1]:font-medium [&_h1]:text-on-surface [&_h1]:mt-5 [&_h1]:mb-2
          [&_h2]:text-base [&_h2]:font-display [&_h2]:font-medium [&_h2]:text-on-surface [&_h2]:mt-4 [&_h2]:mb-2
          [&_h3]:text-sm [&_h3]:font-display [&_h3]:font-medium [&_h3]:text-on-surface [&_h3]:mt-3 [&_h3]:mb-1
          [&_blockquote]:border-l-2 [&_blockquote]:border-secondary/20 [&_blockquote]:pl-4 [&_blockquote]:text-on-surface-variant/70 [&_blockquote]:italic
          [&_a]:text-secondary [&_a]:underline [&_a]:underline-offset-2 [&_a]:decoration-secondary/30
          [&_hr]:border-primary/[0.06] [&_hr]:my-4
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayText}</ReactMarkdown>
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
        background: 'linear-gradient(135deg, rgba(8,145,178,0.04), rgba(124,58,237,0.03))',
        border: '1px solid rgba(8,145,178,0.08)',
      }}
      layout
    >
      <button onClick={() => setExpanded(!expanded)} className="flex items-start gap-2.5 px-4 py-3 w-full text-left">
        <Brain className="h-3.5 w-3.5 text-secondary/50 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
        <span className="text-xs text-on-surface-muted/50 leading-relaxed flex-1">{expanded ? content : preview}</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <ChevronDown className="h-3 w-3 text-on-surface-muted/25 flex-shrink-0 mt-0.5" strokeWidth={2} />
        </motion.div>
      </button>
    </motion.div>
  )
}

// ─── Streaming indicator — the system is working ────────────────────

function StreamingIndicator({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-3 space-y-3">
      {text && (
        <div className="text-sm leading-[1.85] text-on-surface-variant
          [&_p]:my-0 [&_p+p]:mt-3
          [&_strong]:text-on-surface [&_strong]:font-semibold
          [&_code]:rounded-lg [&_code]:bg-primary/[0.05] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.78em] [&_code]:text-primary
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      )}
      <div className="flex items-center gap-3">
        {/* Chromatic breathing dots instead of a spinner */}
        <div className="flex items-center gap-1.5">
          {[
            { color: '#0D7C5A', delay: 0 },
            { color: '#0891B2', delay: 0.15 },
            { color: '#7C3AED', delay: 0.3 },
          ].map((dot, i) => (
            <motion.div
              key={i}
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: dot.color }}
              animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.3, 0.8, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: dot.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>
        <span className="text-[11px] text-on-surface-muted/35 font-mono">
          {text ? 'working' : 'thinking'}
        </span>
      </div>
    </motion.div>
  )
}

// ─── Token usage — ambient awareness of context window ──────────────

function TokenBar() {
  const { data } = useQuery({ queryKey: ['os-tokens'], queryFn: getTokenUsage, staleTime: 15_000, retry: 1 })
  const compacting = useOSSessionStore(s => s.compacting)

  if (!data || data.total === 0) return null

  const pct = Math.min((data.total / data.threshold) * 100, 100)
  const isHigh = pct > 75

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 px-1"
    >
      <div className="flex-1 h-0.5 rounded-full bg-on-surface-muted/[0.06] overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: isHigh
              ? 'linear-gradient(90deg, #D97706, #E11D48)'
              : 'linear-gradient(90deg, #0D7C5A, #0891B2)',
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

// ─── Main CCStream component ────────────────────────────────────────

export default function CCStream() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const messages = useOSSessionStore(s => s.messages)
  const status = useOSSessionStore(s => s.status)
  const streamText = useOSSessionStore(s => s.streamText)
  const addUserMessage = useOSSessionStore(s => s.addUserMessage)

  const ghostPrompt = useGhostPrompt()
  const canSend = input.trim().length > 0 && status !== 'streaming'

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status, streamText])

  useEffect(() => { inputRef.current?.focus() }, [])

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
        if (result.text) store.appendStreamText(result.text)
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
      {/* Chat stream with ambient vitals */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">
          {/* Ambient welcome state — when no conversation yet */}
          {!hasMessages && status !== 'streaming' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
              className="flex flex-col items-center pt-[10vh] pb-4"
            >
              {/* Chromatic title */}
              <span className="text-label-md font-display uppercase tracking-[0.25em] text-on-surface-muted/30">
                Ambient Intelligence
              </span>
              <h1 className="mt-3 font-display text-display-lg font-light text-on-surface">
                Eco<span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">dia</span>OS
              </h1>

              {/* The Breath — chromatic version */}
              <div className="mt-8 mb-6 flex items-center gap-2">
                {[
                  { color: 'rgba(13,124,90,0.25)', delay: 0 },
                  { color: 'rgba(8,145,178,0.20)', delay: 0.3 },
                  { color: 'rgba(124,58,237,0.15)', delay: 0.6 },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    className="rounded-full"
                    style={{ backgroundColor: b.color, width: 3, height: 3 }}
                    animate={{
                      scale: [1, 1.8, 1],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: b.delay, ease: 'easeInOut' }}
                  />
                ))}
              </div>

              {/* Live vitals — the system surfaces what matters */}
              <AmbientVitals />

              {/* Action proposals */}
              <div className="mt-3 w-full">
                <PendingActionsBanner />
              </div>
            </motion.div>
          )}

          {/* Conversation stream */}
          {hasMessages && (
            <div className="pb-8 pt-4 space-y-1">
              {/* Compact vitals strip at top of active conversation */}
              <AmbientVitals />

              <AnimatePresence initial={false}>
                {messages.map(msg =>
                  msg.role === 'user'
                    ? <UserMessage key={msg.id} message={msg} />
                    : <AssistantMessage key={msg.id} message={msg} />
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Live streaming content */}
          {status === 'streaming' && (
            <StreamingIndicator text={streamText} />
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input — the whisper bar */}
      <SpatialLayer z={20}>
        <div className="mx-auto max-w-3xl px-6 py-4">
          {/* Token usage bar */}
          <TokenBar />

          <div className="mt-2 rounded-2xl transition-all chromatic-focus"
            style={{
              background: 'rgba(255, 255, 255, 0.68)',
              border: '1px solid rgba(255, 255, 255, 0.60)',
              borderTopColor: 'rgba(255, 255, 255, 0.80)',
              boxShadow: '0 20px 48px -12px rgba(13,124,90,0.06), 0 8px 20px -8px rgba(8,145,178,0.03), inset 0 1px 0 rgba(255,255,255,0.4)',
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
                    background: canSend ? 'linear-gradient(135deg, #0D7C5A, #14B882)' : 'transparent',
                    boxShadow: canSend ? '0 4px 16px -4px rgba(13,124,90,0.30)' : 'none',
                    color: canSend ? 'white' : 'rgba(13,124,90,0.3)',
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
