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
 * The system speaks. You observe. Occasionally you interrupt.
 */
import { useState, useRef, useEffect, useCallback, useMemo, useId, useDeferredValue, memo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, RotateCcw, Brain, ChevronDown, ChevronUp,
  Mail, DollarSign, Zap, Activity,
  GitBranch, TrendingUp, Download,
  Paperclip, FileText, X, Trash2, Image as ImageIcon,
  Wrench, CheckCircle2, Clock, Copy, Check,
} from 'lucide-react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MermaidBlock } from '@/components/MermaidBlock'
import { useOSSessionStore, type OSSessionMessage, type LiveToolCall } from '@/store/osSessionStore'
import { sendOSMessage, restartOS, getTokenUsage, getOSStatus, recoverResponse } from '@/api/osSession'
import { EnergyWhisper } from '@/components/spatial/EnergyWhisper'
import { getGmailStats } from '@/api/gmail'
import { getFinanceSummary } from '@/api/finance'
import { getActionStats } from '@/api/actions'
import { getMomentum } from '@/api/momentum'
import type { AttachedFile } from '@/types/cortex'

// ─── File helpers ────────────────────────────────────────────────────

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function readFileAsAttachment(file: File): Promise<AttachedFile> {
  const id = crypto.randomUUID()
  if (file.type.startsWith('image/')) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target!.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    return { id, name: file.name, type: file.type, size: file.size, dataUrl }
  }
  if (file.type.startsWith('text/') || file.name.match(/\.(md|txt|csv|json|ts|tsx|js|jsx|py|go|rs|sh|yaml|yml|toml|sql|html|css|xml)$/i)) {
    const text = await file.text()
    return { id, name: file.name, type: file.type || 'text/plain', size: file.size, text }
  }
  return { id, name: file.name, type: file.type || 'application/octet-stream', size: file.size }
}

// ─── Attachment chip ─────────────────────────────────────────────────

function AttachmentChip({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  if (file.dataUrl) {
    return (
      <div className="group relative flex-shrink-0">
        <img src={file.dataUrl} alt={file.name} className="h-14 w-14 rounded-xl object-cover" style={{ border: '1px solid rgba(27,122,61,0.12)' }} />
        <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-on-surface text-surface shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
        </button>
      </div>
    )
  }
  return (
    <div className="group flex items-center gap-2 rounded-xl px-3 py-2 flex-shrink-0" style={{ border: '1px solid rgba(27,122,61,0.10)', background: 'rgba(27,122,61,0.03)' }}>
      <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#1B7A3D' }} strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="max-w-[120px] truncate text-xs font-medium text-on-surface">{file.name}</p>
        <p className="text-[10px] text-on-surface-muted/50">{formatBytes(file.size)}</p>
      </div>
      <button onClick={onRemove} className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-on-surface-muted/40 hover:text-error transition-colors">
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  )
}

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

function useGhostPrompt(): { text: string; key: number } {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % GHOST_PROMPTS.length), 7000)
    return () => clearInterval(t)
  }, [])
  return { text: GHOST_PROMPTS[idx], key: idx }
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

// ─── Tool accents ────────────────────────────────────────────────────

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

// ─── Live Tool Call Panel ─────────────────────────────────────────────
// Memoized so text-delta re-renders of StreamingOutput don't cascade into tools.

const LiveToolPanel = memo(function LiveToolPanel({ tool }: { tool: LiveToolCall }) {
  const [open, setOpen] = useState(false)
  const accent = getToolAccent(tool.name)
  const isDone = tool.completedAt !== undefined
  const elapsed = isDone
    ? ((tool.completedAt! - tool.startedAt) / 1000).toFixed(1) + 's'
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent.color}06, ${accent.color}03)`,
        border: `1px solid ${accent.color}18`,
        boxShadow: `0 2px 12px -4px ${accent.glow}`,
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left"
      >
        {isDone ? (
          <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" style={{ color: accent.color }} strokeWidth={2} />
        ) : (
          <motion.div
            className="h-3.5 w-3.5 flex-shrink-0 flex items-center justify-center"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          >
            <Wrench className="h-3.5 w-3.5" style={{ color: accent.color }} strokeWidth={1.75} />
          </motion.div>
        )}
        <span className="flex-1 text-[11px] font-mono tracking-wide" style={{ color: `${accent.color}cc` }}>
          {tool.name}
        </span>
        {isDone ? (
          <span className="text-[10px] font-mono text-on-surface-muted/30 flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" strokeWidth={1.75} />
            {elapsed}
          </span>
        ) : (
          <motion.div
            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent.color, boxShadow: `0 0 6px ${accent.color}80` }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {(tool.input || tool.result) && (
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
            <ChevronDown className="h-3 w-3 text-on-surface-muted/30 flex-shrink-0" strokeWidth={2} />
          </motion.div>
        )}
      </button>
      <AnimatePresence>
        {open && (tool.input || tool.result) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {tool.input && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/30 mb-1">input</p>
                  <pre className="text-[10px] font-mono text-on-surface-muted/50 whitespace-pre-wrap break-all leading-relaxed overflow-x-auto max-h-32"
                    style={{ background: `${accent.color}04`, borderRadius: 6, padding: '6px 8px' }}>
                    {tool.input}
                  </pre>
                </div>
              )}
              {tool.result && (
                <div>
                  <p className="text-[9px] font-mono uppercase tracking-widest text-on-surface-muted/30 mb-1">result</p>
                  <pre className="text-[10px] font-mono text-on-surface-muted/50 whitespace-pre-wrap break-all leading-relaxed overflow-x-auto max-h-40"
                    style={{ background: 'rgba(5,150,105,0.04)', borderRadius: 6, padding: '6px 8px' }}>
                    {tool.result.length > 1200 ? tool.result.slice(0, 1200) + '\n… (truncated)' : tool.result}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
})

// ─── Finalized tool badge (in completed messages) ────────────────────

function ToolBadge({ toolName, i }: { toolName: string; i: number }) {
  const accent = getToolAccent(toolName)
  return (
    <motion.div
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
      <div
        className="h-1 w-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: accent.color, boxShadow: `0 0 4px ${accent.color}60` }}
      />
      <span className="text-[11px] font-mono tracking-wide" style={{ color: `${accent.color}cc` }}>
        {toolName}
      </span>
    </motion.div>
  )
}

// ─── API base URL ────────────────────────────────────────────────────

function getApiBase() {
  return (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || 'https://api.admin.ecodia.au'
}

// ─── Download button — rendered when OS outputs a download:// link ───
// Usage in OS response: [⬇ Download invoice.pdf](download:///api/files/invoice.pdf)

function DownloadButton({ href, label }: { href: string; label: string }) {
  const [downloading, setDownloading] = useState(false)
  const [done, setDone] = useState(false)

  const url = href.startsWith('http') ? href : `${getApiBase()}${href.startsWith('/') ? '' : '/'}${href}`
  const fileName = label.replace(/^[⬇↓\s]+/, '').trim() || url.split('/').pop() || 'file'

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = fileName
      a.click()
      URL.revokeObjectURL(a.href)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    } catch {
      window.open(url, '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.button
      onClick={handleDownload}
      disabled={downloading}
      whileTap={{ scale: 0.96 }}
      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium my-1"
      style={{
        background: done
          ? 'linear-gradient(135deg, rgba(5,150,105,0.10), rgba(46,204,113,0.06))'
          : 'linear-gradient(135deg, rgba(27,122,61,0.08), rgba(46,204,113,0.04))',
        border: `1px solid ${done ? 'rgba(5,150,105,0.20)' : 'rgba(27,122,61,0.15)'}`,
        color: done ? '#059669' : '#1B7A3D',
      }}
    >
      {downloading ? (
        <motion.div
          className="h-3.5 w-3.5 rounded-full border-2"
          style={{ borderColor: '#1B7A3D', borderTopColor: 'transparent' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <Download className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
      )}
      <span>{done ? 'Downloaded' : fileName}</span>
    </motion.button>
  )
}

// ─── Copy-code button ─────────────────────────────────────────────────

function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }, [code])
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2.5 right-2.5 flex items-center gap-1.5 rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
      style={{
        background: 'rgba(27,122,61,0.12)',
        border: '1px solid rgba(27,122,61,0.18)',
        color: copied ? '#2ECC71' : 'rgba(27,122,61,0.7)',
        fontSize: 10,
      }}
    >
      {copied ? <Check className="h-2.5 w-2.5" strokeWidth={2.5} /> : <Copy className="h-2.5 w-2.5" strokeWidth={1.75} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Custom ReactMarkdown renderers ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MARKDOWN_COMPONENTS: Components = {
  a({ href, children }) {
    const label = typeof children === 'string' ? children : ''
    if (href?.startsWith('download://')) {
      return <DownloadButton href={href.replace('download://', '')} label={label} />
    }
    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary/80 underline underline-offset-2 hover:text-primary transition-colors">{children}</a>
  },
  pre({ children }) {
    // Wrap pre in a group so copy button can hover-show
    const code = typeof children === 'object' && children !== null && 'props' in (children as React.ReactElement)
      ? String((children as React.ReactElement).props?.children ?? '')
      : String(children ?? '')
    return (
      <div className="group relative">
        <pre>{children}</pre>
        <CopyCodeButton code={code} />
      </div>
    )
  },
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className || '')
    if (match?.[1] === 'mermaid') return <MermaidBlock code={String(children).replace(/\n$/, '')} />
    return <code className={className}>{children}</code>
  },
}

// ─── Message renderers ──────────────────────────────────────────────

function fmtTimestamp(ts: Date | string | undefined): string {
  if (!ts) return ''
  const d = ts instanceof Date ? ts : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function UserMessage({ message, isInterrupt }: { message: OSSessionMessage; isInterrupt?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 22 }}
      className="group py-3"
    >
      <div className="rounded-2xl px-5 py-3.5" style={{
        background: isInterrupt
          ? 'linear-gradient(135deg, rgba(217,119,6,0.07), rgba(251,191,36,0.04))'
          : 'linear-gradient(135deg, rgba(27,122,61,0.05), rgba(46,204,113,0.03))',
        border: `1px solid ${isInterrupt ? 'rgba(217,119,6,0.12)' : 'rgba(27,122,61,0.08)'}`,
        boxShadow: isInterrupt
          ? '0 2px 12px -4px rgba(217,119,6,0.08)'
          : '0 2px 12px -4px rgba(27,122,61,0.06)',
      }}>
        {isInterrupt && (
          <p className="text-[9px] font-mono uppercase tracking-widest mb-1.5" style={{ color: 'rgba(217,119,6,0.5)' }}>
            interrupt
          </p>
        )}
        <p className="text-sm leading-relaxed text-on-surface font-medium">{message.content}</p>
      </div>
      {message.timestamp && (
        <p className="mt-1 px-1 text-[10px] font-mono text-on-surface-muted/20 opacity-0 group-hover:opacity-100 transition-opacity">
          {fmtTimestamp(message.timestamp)}
        </p>
      )}
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
      className="group py-3 space-y-3"
    >
      {thinkingBlocks.map((t, i) => (
        <ThinkingBlock key={`think-${i}`} content={t.content} />
      ))}

      {toolUses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolUses.map((t, i) => (
            <ToolBadge key={`tool-${i}`} toolName={t.toolName || t.content} i={i} />
          ))}
        </div>
      )}

      {displayText && (
        <div className="cortex-prose text-sm leading-[1.85] text-on-surface-variant">
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{displayText}</ReactMarkdown>
        </div>
      )}

      {message.timestamp && (
        <p className="px-1 text-[10px] font-mono text-on-surface-muted/20 opacity-0 group-hover:opacity-100 transition-opacity">
          {fmtTimestamp(message.timestamp)}
        </p>
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

// ─── Streaming tools panel — memoized, only re-renders when tools change ──

const StreamingTools = memo(function StreamingTools({ tools }: { tools: LiveToolCall[] }) {
  if (tools.length === 0) return null
  return (
    <div className="space-y-1.5">
      {tools.map(tool => (
        <LiveToolPanel key={tool.id} tool={tool} />
      ))}
    </div>
  )
})

// ─── Streaming text — deferred so high-frequency deltas don't block UI ──

function StreamingText({ text }: { text: string }) {
  // useDeferredValue lets React deprioritise the Markdown re-parse during rapid deltas
  const deferred = useDeferredValue(text)
  if (!deferred) return null
  return (
    <div className="cortex-prose text-sm leading-[1.85] text-on-surface-variant">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>{deferred}</ReactMarkdown>
    </div>
  )
}

// ─── Streaming output — text + live tool panels ─────────────────────

function StreamingOutput({ text, tools }: { text: string; tools: LiveToolCall[] }) {
  const hasActiveTools = tools.some(t => !t.completedAt)
  return (
    <div className="py-3 space-y-3">
      <StreamingTools tools={tools} />
      <StreamingText text={text} />
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
          {hasActiveTools ? 'using tools' : text ? 'working' : 'thinking'}
        </span>
      </div>
    </div>
  )
}

// ─── Interrupt notification banner ────────────────────────────────────

function InterruptBanner({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-2 rounded-xl px-3 py-2 mx-auto max-w-sm"
      style={{
        background: 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(251,191,36,0.04))',
        border: '1px solid rgba(217,119,6,0.15)',
      }}
    >
      <motion.div
        className="h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: '#F59E0B' }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
      <span className="text-[11px] font-mono text-on-surface-muted/50">
        {count} interrupt{count > 1 ? 's' : ''} queued — OS will read when it pauses
      </span>
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

const VISIBLE_BATCH = 30
// Distance from bottom (px) before we stop auto-scrolling
const SCROLL_LOCK_THRESHOLD = 120

export default function CCStream() {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [visibleCount, setVisibleCount] = useState(VISIBLE_BATCH)
  const [userScrolledUp, setUserScrolledUp] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const lastSeenMessageCount = useRef(0)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()
  const chatEndRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  // Ref mirror for use inside callbacks without stale closure
  const scrolledUpRef = useRef(false)
  const isProgrammaticScroll = useRef(false)

  const allMessages = useOSSessionStore(s => s.messages)
  const status = useOSSessionStore(s => s.status)
  const streamText = useOSSessionStore(s => s.streamText)
  const streamTools = useOSSessionStore(s => s.streamTools)
  const interruptQueue = useOSSessionStore(s => s.interruptQueue)
  const addUserMessage = useOSSessionStore(s => s.addUserMessage)
  const queueInterrupt = useOSSessionStore(s => s.queueInterrupt)
  const clearInterruptQueue = useOSSessionStore(s => s.clearInterruptQueue)

  const messages = useMemo(() => {
    if (allMessages.length <= visibleCount) return allMessages
    return allMessages.slice(-visibleCount)
  }, [allMessages, visibleCount])
  const hasEarlier = allMessages.length > visibleCount

  const ghostPrompt = useGhostPrompt()
  const isStreaming = status === 'streaming'
  // ghost prompt fades: key change triggers AnimatePresence exit+enter
  // Always allow sending — during streaming it becomes an interrupt
  const canSend = input.trim().length > 0 || attachments.length > 0

  // File handlers
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const parsed = await Promise.all(Array.from(files).map(readFileAsAttachment))
    setAttachments(prev => [...prev, ...parsed])
  }, [])

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const imageItems = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/'))
    if (!imageItems.length) return
    e.preventDefault()
    const files = imageItems.map(i => i.getAsFile()).filter(Boolean) as File[]
    await handleFiles(files)
  }, [handleFiles])

  // Track whether user has scrolled away from bottom
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => {
      if (isProgrammaticScroll.current) return
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      const scrolledUp = distFromBottom > SCROLL_LOCK_THRESHOLD
      scrolledUpRef.current = scrolledUp
      setUserScrolledUp(scrolledUp)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = chatEndRef.current
    if (!el) return
    isProgrammaticScroll.current = true
    el.scrollIntoView({ behavior })
    setTimeout(() => { isProgrammaticScroll.current = false }, 400)
  }, [])

  // Auto-scroll as stream text grows — only when user hasn't scrolled up
  useEffect(() => {
    if (!scrolledUpRef.current) {
      scrollToBottom('smooth')
    }
  }, [streamText, scrollToBottom])

  // Auto-scroll on new messages — always on own message, otherwise respect scroll lock
  const prevMessageCount = useRef(messages.length)
  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'user') {
        scrolledUpRef.current = false
        setUserScrolledUp(false)
        setUnreadCount(0)
        lastSeenMessageCount.current = messages.length
        scrollToBottom('smooth')
      } else if (!scrolledUpRef.current) {
        lastSeenMessageCount.current = messages.length
        scrollToBottom('smooth')
      } else {
        // User is scrolled up — accumulate unread count
        setUnreadCount(messages.length - lastSeenMessageCount.current)
      }
    }
    prevMessageCount.current = messages.length
  }, [messages, scrollToBottom])

  useEffect(() => { inputRef.current?.focus() }, [])

  // '/' from anywhere refocuses the input (like Slack/Linear)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const active = document.activeElement
      const isEditing = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
      if (isEditing) return
      if (e.key === '/' || e.key === 'Escape') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    if (!text && !attachments.length) return

    const currentAttachments = [...attachments]
    setInput('')
    setAttachments([])
    if (inputRef.current) inputRef.current.style.height = 'auto'

    let fullMessage = text
    for (const a of currentAttachments) {
      if (a.dataUrl) {
        fullMessage = `${fullMessage}\n\n[Image: ${a.name}]\n${a.dataUrl}`
      } else if (a.text) {
        fullMessage = `${fullMessage}\n\n[File: ${a.name}]\n${a.text}`
      } else {
        fullMessage = `${fullMessage}\n\n[Attached: ${a.name} (${formatBytes(a.size)}, ${a.type})]`
      }
    }
    fullMessage = fullMessage.trim() || `[Attached ${currentAttachments.map(a => a.name).join(', ')}]`

    if (isStreaming) {
      // Interrupt: show in thread immediately, queue for OS awareness
      queueInterrupt(fullMessage)
      addUserMessage(fullMessage)
      try {
        await sendOSMessage(fullMessage)
      } catch {
        // Interrupt delivery failure is non-fatal
      }
      return
    }

    addUserMessage(fullMessage)
    clearInterruptQueue()
    try {
      const result = await sendOSMessage(fullMessage)
      const store = useOSSessionStore.getState()
      if (store.status === 'streaming') {
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
  }, [input, attachments, isStreaming, addUserMessage, queueInterrupt, clearInterruptQueue])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Resize textarea without layout thrash: use requestAnimationFrame
    // to batch the height reset and measurement into one frame
    const el = e.target
    requestAnimationFrame(() => {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    })
  }, [])

  const handleRestart = useCallback(async () => {
    await restartOS()
    useOSSessionStore.getState().clearMessages()
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false) }}
      onDrop={async e => { e.preventDefault(); setIsDragging(false); await handleFiles(e.dataTransfer.files) }}
    >
      {/* Drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-4 rounded-3xl border-2 border-dashed" style={{ borderColor: 'rgba(27,122,61,0.35)', background: 'rgba(27,122,61,0.02)' }} />
            <div className="relative flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(27,122,61,0.08)' }}>
                <ImageIcon className="h-6 w-6" style={{ color: '#1B7A3D' }} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-on-surface">Drop to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-5xl px-6">
          {/* Welcome state */}
          {!hasMessages && !isStreaming && (
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

          {/* Conversation thread */}
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
                {messages.map((msg, i) => {
                  const prevMsg = messages[i - 1]
                  const isInterrupt = msg.role === 'user' && prevMsg?.role === 'user'
                  return msg.role === 'user'
                    ? <UserMessage key={msg.id} message={msg} isInterrupt={isInterrupt} />
                    : <AssistantMessage key={msg.id} message={msg} />
                })}
              </AnimatePresence>
            </div>
          )}

          {/* Live streaming output */}
          {isStreaming && <StreamingOutput text={streamText} tools={streamTools} />}

          {/* Interrupt queue indicator */}
          <AnimatePresence>
            {isStreaming && interruptQueue.length > 0 && (
              <div className="pb-3">
                <InterruptBanner count={interruptQueue.length} />
              </div>
            )}
          </AnimatePresence>

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Floating scroll-to-bottom button with unread count */}
      <AnimatePresence>
        {userScrolledUp && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 8 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22 }}
            onClick={() => {
              scrolledUpRef.current = false
              setUserScrolledUp(false)
              setUnreadCount(0)
              lastSeenMessageCount.current = messages.length
              scrollToBottom('smooth')
            }}
            className="absolute bottom-28 right-8 z-20 flex items-center gap-1.5 rounded-full shadow-lg px-3 py-2"
            style={{
              background: 'linear-gradient(135deg, rgba(27,122,61,0.90), rgba(46,204,113,0.80))',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(27,122,61,0.20)',
              boxShadow: '0 4px 20px -4px rgba(27,122,61,0.35)',
              color: 'white',
            }}
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="text-[11px] font-mono font-semibold leading-none">
                {unreadCount} new
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input area */}
      <div className="w-full px-6 pb-8 pt-3 lg:px-16 xl:px-24">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center gap-4 mb-1">
            <div className="flex-1"><TokenBar /></div>
            <EnergyWhisper />
          </div>

          {/* Attachment chips */}
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-2 flex flex-wrap gap-2 px-1 pb-1">
                  {attachments.map(a => (
                    <AttachmentChip key={a.id} file={a} onRemove={() => setAttachments(prev => prev.filter(f => f.id !== a.id))} />
                  ))}
                  {attachments.length > 1 && (
                    <button onClick={() => setAttachments([])} className="flex items-center gap-1 self-end rounded-lg px-2 py-1 text-[10px] text-on-surface-muted/50 hover:text-error transition-colors">
                      <Trash2 className="h-3 w-3" strokeWidth={1.75} /> Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-1 rounded-2xl transition-all duration-300"
            style={{
              background: 'rgba(255, 255, 255, 0.68)',
              border: isStreaming
                ? '1px solid rgba(217,119,6,0.20)'
                : '1px solid rgba(255, 255, 255, 0.55)',
              borderTopColor: isStreaming
                ? 'rgba(217,119,6,0.25)'
                : 'rgba(255, 255, 255, 0.80)',
              boxShadow: isStreaming
                ? '0 20px 48px -12px rgba(217,119,6,0.08), 0 8px 20px -8px rgba(217,119,6,0.04), inset 0 1px 0 rgba(255,255,255,0.4)'
                : '0 20px 48px -12px rgba(27,122,61,0.06), 0 8px 20px -8px rgba(217,119,6,0.02), inset 0 1px 0 rgba(255,255,255,0.4)',
            }}
          >
            {/* Interrupt mode hint strip */}
            <AnimatePresence>
              {isStreaming && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-5 pt-3 pb-0">
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: '#F59E0B' }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-mono text-on-surface-muted/35 tracking-wide">
                      interrupt mode — OS will respond when it pauses
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-end gap-3 px-5 py-4">
              {/* Paperclip */}
              <label htmlFor={fileInputId} className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl text-on-surface-muted/30 transition-all hover:text-on-surface-muted/60" style={{ color: 'rgba(27,122,61,0.35)' }}>
                <Paperclip className="h-4 w-4" strokeWidth={1.75} />
              </label>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.go,.rs,.sh,.yaml,.yml,.toml,.sql,.html,.css,.xml,.doc,.docx,.xls,.xlsx"
                className="sr-only"
                onChange={e => e.target.files && handleFiles(e.target.files)}
              />

              <div className="relative flex-1">
                {/* Animated ghost placeholder — fades between prompts */}
                {!input && !isStreaming && (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={ghostPrompt.key}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="pointer-events-none absolute inset-0 flex items-center text-sm text-on-surface-muted/25 leading-relaxed"
                      aria-hidden
                    >
                      {ghostPrompt.text}
                    </motion.span>
                  </AnimatePresence>
                )}
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={isStreaming ? 'Interrupt…' : ''}
                  rows={1}
                  className="w-full resize-none bg-transparent text-sm text-on-surface outline-none leading-relaxed"
                  style={{ maxHeight: 200 }}
                />
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={handleRestart}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-on-surface-muted/25 hover:text-on-surface-muted/50 hover:bg-on-surface-muted/[0.04]"
                    title="New session"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
                  </button>
                )}
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl disabled:opacity-0 transition-all"
                  title={isStreaming ? 'Send interrupt' : 'Send'}
                  style={{
                    background: !canSend
                      ? 'transparent'
                      : isStreaming
                        ? 'linear-gradient(135deg, #D97706, #F59E0B)'
                        : 'linear-gradient(135deg, #1B7A3D, #2ECC71)',
                    boxShadow: !canSend
                      ? 'none'
                      : isStreaming
                        ? '0 4px 16px -4px rgba(245,158,11,0.4), 0 0 12px rgba(245,158,11,0.15)'
                        : '0 4px 16px -4px rgba(46,204,113,0.35), 0 0 12px rgba(46,204,113,0.15)',
                    color: canSend ? 'white' : 'rgba(27,122,61,0.3)',
                  }}
                >
                  {isStreaming
                    ? <ChevronUp className="h-4 w-4" strokeWidth={2.5} />
                    : <ArrowUp className="h-4 w-4" strokeWidth={2} />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
