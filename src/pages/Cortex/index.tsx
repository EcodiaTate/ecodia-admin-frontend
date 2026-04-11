/**
 * Cortex — The River
 *
 * Not a chatbot. A presence with continuous awareness.
 *
 * Four element types sharing one vertical stream:
 *   1. Voice (human) — full opacity, zinc-900, medium weight
 *   2. Response (Cortex) — zinc-700, character-by-character feel
 *   3. Event (system) — zinc-400, mono, sm, one line
 *   4. Surfacing (proactive) — teal left accent, organism noticed something
 *
 * The Breath: resting state = slow vertical line pulse (4s sine)
 * Undertow: thin horizontal traces below breath = active processes
 * Ghost Prompts: contextual rotating placeholder
 * Condensation: arriving items compress while typing
 *
 * Input is NEVER blocked. Multiple requests fly concurrently.
 */
import { useState, useRef, useEffect, useCallback, useId, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getKGStats } from '@/api/knowledgeGraph'
import { sendCortexChat, getCortexBriefing } from '@/api/cortex'
import { getSession } from '@/api/claudeCode'
import { useCortexStore } from '@/store/cortexStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, Brain, Network, Paperclip,
  X, FileText, Image as ImageIcon, Trash2,
  CheckCircle2, XCircle, MinusCircle, Zap,
} from 'lucide-react'
import { ConstellationCanvas } from './ConstellationCanvas'
import { BlockRenderer } from './blocks/BlockRenderer'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MarkdownLink } from '@/components/shared/MarkdownLink'
// import OSChat from './OSChat'  // Replaced by CCStream
import type { ChatMessage, AttachedFile, CCSessionBlock, AmbientEvent } from '@/types/cortex'

// ─── Ghost prompts — contextual, rotating ────────────────────────────
const GHOST_PROMPTS = [
  'Ask anything, run code, attach files...',
  'What happened while I was away?',
  'Deploy the latest changes',
  'Summarise today\'s activity',
  'Check the pipeline health',
  'What does the organism think?',
]

function useGhostPrompt(): string {
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % GHOST_PROMPTS.length), 8000)
    return () => clearInterval(t)
  }, [])
  return GHOST_PROMPTS[idx]
}

// ─── File helpers ─────────────────────────────────────────────────────
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

// ─── Compact components ──────────────────────────────────────────────
function AttachmentChip({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  if (file.dataUrl) {
    return (
      <div className="group relative flex-shrink-0">
        <img src={file.dataUrl} alt={file.name} className="h-16 w-16 rounded-xl object-cover border border-black/8" />
        <button onClick={onRemove} className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-on-surface text-surface shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
        </button>
      </div>
    )
  }
  return (
    <div className="group flex items-center gap-2 rounded-xl border border-black/8 bg-surface-container-low px-3 py-2 flex-shrink-0">
      <FileText className="h-4 w-4 text-on-surface-muted/60 flex-shrink-0" strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="max-w-[120px] truncate text-xs font-medium text-on-surface">{file.name}</p>
        <p className="text-[10px] text-on-surface-muted/50">{formatBytes(file.size)}</p>
      </div>
      <button onClick={onRemove} className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-on-surface-muted/40 hover:bg-error/10 hover:text-error transition-colors">
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  )
}

function UserAttachments({ attachments }: { attachments: AttachedFile[] }) {
  if (!attachments.length) return null
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map(a => a.dataUrl ? (
        <img key={a.id} src={a.dataUrl} alt={a.name} className="h-24 w-24 rounded-xl object-cover border border-black/8" />
      ) : (
        <div key={a.id} className="flex items-center gap-2 rounded-xl border border-black/8 bg-white/60 px-3 py-2">
          <FileText className="h-4 w-4 text-on-surface-muted/60" strokeWidth={1.5} />
          <div>
            <p className="text-xs font-medium text-on-surface">{a.name}</p>
            <p className="text-[10px] text-on-surface-muted/50">{formatBytes(a.size)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── The Breath — slow vertical line pulse (4s sine) ─────────────────
function CortexBreath({ state }: { state: 'resting' | 'attentive' | 'flowing' }) {
  const duration = state === 'attentive' ? 1.5 : state === 'flowing' ? 0.8 : 4

  return (
    <motion.div
      className="mx-auto w-px rounded-full"
      style={{ backgroundColor: 'rgba(0, 104, 122, 0.15)' }}
      animate={{
        height: [16, 24, 16],
        opacity: [0.2, 0.5, 0.2],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

// ─── Undertow — thin traces for active processes ─────────────────────
function Undertow({ inflightCount, hasActiveSessions }: { inflightCount: number; hasActiveSessions: boolean }) {
  const traces = useMemo(() => {
    const t: Array<{ color: string; delay: number; duration: number }> = []
    if (inflightCount > 0) {
      t.push({ color: 'rgba(0, 104, 122, 0.15)', delay: 0, duration: 3 }) // teal = Cortex thinking
    }
    if (hasActiveSessions) {
      t.push({ color: 'rgba(46, 204, 113, 0.12)', delay: 0.5, duration: 4 }) // green = Factory session
    }
    return t
  }, [inflightCount, hasActiveSessions])

  if (traces.length === 0) return null

  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      {traces.map((trace, i) => (
        <motion.div
          key={i}
          className="h-px rounded-full"
          style={{ backgroundColor: trace.color }}
          animate={{
            width: ['0%', '60%', '0%'],
            x: ['-30%', '30%', '-30%'],
          }}
          transition={{
            duration: trace.duration,
            repeat: Infinity,
            delay: trace.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// ─── River Element: Event (system) ───────────────────────────────────
const AMBIENT_ICONS: Record<AmbientEvent['kind'], React.ReactNode> = {
  action_success: <CheckCircle2 className="h-2.5 w-2.5 text-secondary/60" strokeWidth={1.75} />,
  action_failure: <XCircle className="h-2.5 w-2.5 text-tertiary/60" strokeWidth={1.75} />,
  action_dismissed: <MinusCircle className="h-2.5 w-2.5 text-on-surface-muted/40" strokeWidth={1.75} />,
  action_expired: <MinusCircle className="h-2.5 w-2.5 text-tertiary/50" strokeWidth={1.75} />,
  cc_complete: <Zap className="h-2.5 w-2.5 text-primary/50" strokeWidth={1.75} />,
  cc_error: <XCircle className="h-2.5 w-2.5 text-tertiary/50" strokeWidth={1.75} />,
  cc_deployed: <CheckCircle2 className="h-2.5 w-2.5 text-secondary/70" strokeWidth={1.75} />,
  cc_deploy_failed: <XCircle className="h-2.5 w-2.5 text-tertiary/60" strokeWidth={1.75} />,
  cc_started: <Zap className="h-2.5 w-2.5 text-primary/40" strokeWidth={1.75} />,
  organism_surfacing: <Brain className="h-2.5 w-2.5 text-primary/40" strokeWidth={1.75} />,
  system: <Zap className="h-2.5 w-2.5 text-on-surface-muted/30" strokeWidth={1.75} />,
}

function RiverEvent({ event }: { event: AmbientEvent }) {
  const isSurfacing = event.kind === 'organism_surfacing'

  return (
    <motion.div
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 22 }}
      className={`flex items-center gap-2 py-1 ${
        isSurfacing ? 'border-l-2 border-primary/20 pl-3' : ''
      }`}
    >
      {AMBIENT_ICONS[event.kind]}
      <span className={`text-[11px] font-mono leading-snug ${
        isSurfacing ? 'text-on-surface-variant/60' : 'text-on-surface-muted/35'
      }`}>
        {event.summary}
      </span>
    </motion.div>
  )
}

// ─── River Element: Voice (human) ────────────────────────────────────
function RiverVoice({ message }: { message: ChatMessage }) {
  if (message.content?.startsWith('[SYSTEM EVENT]')) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 22 }}
      className="py-2"
    >
      {message.attachments && <UserAttachments attachments={message.attachments} />}
      {message.content && (
        <p className="text-sm leading-relaxed text-on-surface font-medium">
          {message.content}
        </p>
      )}
    </motion.div>
  )
}

// ─── River Element: Response (Cortex) ────────────────────────────────
function RiverResponse({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.04 }}
      className="py-2"
    >
      <div className="space-y-3">
        {message.blocks?.map((block, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 22, delay: isLast ? i * 0.05 : 0 }}
          >
            <BlockRenderer block={block} />
          </motion.div>
        ))}
        {(!message.blocks || message.blocks.length === 0) && message.content && (
          <div className="text-sm leading-[1.8] text-on-surface-variant [&_p]:my-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-on-surface [&_strong]:font-semibold [&_code]:rounded-md [&_code]:bg-black/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.78em] [&_code]:text-primary/90">
            <ReactMarkdown remarkPlugins={[remarkGfm]} urlTransform={(url) => url} components={{ a: MarkdownLink }}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Organism Surfacing Panel ────────────────────────────────────────
function OrganismSurfacing({ content, onAcknowledge }: { content: string; onAcknowledge: () => void }) {
  const [fading, setFading] = useState(false)

  // Auto-fade after 60s if not acknowledged
  useEffect(() => {
    const t = setTimeout(() => setFading(true), 60_000)
    return () => clearTimeout(t)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: -8 }}
      animate={{ opacity: fading ? 0.15 : 1, y: 0, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: 'spring', stiffness: 60, damping: 20, mass: 1.2 }}
      className="border-l-2 border-primary/25 pl-4 py-2 cursor-pointer group"
      onClick={onAcknowledge}
    >
      <p className="text-[13px] leading-relaxed text-on-surface-variant/60 font-light font-display">
        {content}
      </p>
      <span className="text-[9px] text-on-surface-muted/25 opacity-0 group-hover:opacity-100 transition-opacity mt-1 inline-block">
        click to acknowledge
      </span>
    </motion.div>
  )
}

// ─── Self-Modification Proposal Panel ────────────────────────────────
function SelfModPanel({ proposal, onApprove, onExpand }: {
  proposal: { reasoning: string; drives?: string[]; code_paths?: string[] }
  onApprove: () => void
  onExpand: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 50, damping: 20, mass: 1.4 }}
      className="glass-elevated rounded-2xl p-6 holo-border"
    >
      <p className="text-[11px] font-mono uppercase tracking-widest text-primary/40 mb-3">
        Self-modification proposal
      </p>
      <p className="text-sm leading-relaxed text-on-surface-variant/80 mb-4">
        {proposal.reasoning}
      </p>

      {/* Drive alignment dots */}
      {proposal.drives && (
        <div className="flex items-center gap-3 mb-4">
          {proposal.drives.map((drive, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <motion.div
                className="h-2 w-2 rounded-full bg-primary/40"
                animate={{ scale: [1, 1.2, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              />
              <span className="text-[10px] text-on-surface-muted/40 font-mono">{drive}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          onClick={onApprove}
          className="text-sm text-primary/70 hover:text-primary transition-colors"
        >
          Go ahead
        </button>
        <button
          onClick={onExpand}
          className="text-sm text-on-surface-muted/40 hover:text-on-surface-muted/60 transition-colors"
        >
          Tell me more
        </button>
      </div>
    </motion.div>
  )
}

// ─── Peripheral Awareness Marks ──────────────────────────────────────
function PeripheralMarks({ events }: { events: AmbientEvent[] }) {
  // Show right-edge tick marks for processed events, fade over 5 min — full awareness window
  const recent = events.filter(e => Date.now() - e.timestamp.getTime() < 300_000)
  if (recent.length === 0) return null

  return (
    <div className="fixed right-2 top-1/3 z-20 flex flex-col gap-1 pointer-events-none">
      {recent.slice(-30).map(e => (
        <motion.div
          key={e.id}
          initial={{ opacity: 0.4, width: 12 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 30 }}
          className="h-px rounded-full"
          style={{
            backgroundColor: e.kind.includes('error') || e.kind.includes('fail')
              ? 'rgba(200, 145, 10, 0.3)'
              : 'rgba(0, 104, 122, 0.2)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Fire-and-forget Cortex reaction ─────────────────────────────────
let _reactionSessionId: string | null = null
function getReactionSessionId() {
  if (!_reactionSessionId) _reactionSessionId = crypto.randomUUID()
  return _reactionSessionId
}

export function setReactionSessionId(id: string) { _reactionSessionId = id }

async function reactToCortex(summary: string, detail?: string) {
  const s = useCortexStore.getState()
  s.startInflight()
  try {
    const apiMessages = [
      ...s.messages
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content || '[response]' }))
        .filter(m => m.content.trim()),
      { role: 'user' as const, content: `[SYSTEM EVENT] ${summary}${detail ? `\n\nContext:\n${detail}` : ''}` },
    ]
    const res = await sendCortexChat(apiMessages, getReactionSessionId())
    if (res.blocks.length > 0) {
      useCortexStore.getState().addAssistantMessage(res.blocks, res.mentionedNodes)
    }
  } catch { /* silent */ } finally {
    useCortexStore.getState().endInflight()
  }
}

export { reactToCortex }

// ─── Page Router ────────────────────────────────────────────────────
// Unified CC stream — replaces both Organism and OS modes.
// The legacy OrganismCortex function is preserved below for reference but
// is not mounted; the default interface is the persistent CC session.

import CCStream from './CCStream'

export default function CortexPage() {
  return (
    // Escape the scene-container padding — Cortex chat is full-bleed
    <div className="absolute inset-0 overflow-hidden">
      <CCStream />
    </div>
  )
}

// ─── Organism Cortex (legacy — preserved for reference, not mounted) ─
export function OrganismCortex() {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [surfacings, setSurfacings] = useState<Array<{ id: string; content: string }>>([])
  const [selfModProposal, setSelfModProposal] = useState<{ reasoning: string; drives?: string[]; code_paths?: string[] } | null>(null)
  const [sessionId] = useState(() => crypto.randomUUID())
  useEffect(() => { setReactionSessionId(sessionId) }, [sessionId])
  const briefingLoaded = useCortexStore(s => s.briefingLoaded)
  const markBriefingLoaded = useCortexStore(s => s.markBriefingLoaded)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()
  const ghostPrompt = useGhostPrompt()

  const messages = useCortexStore(s => s.messages)
  const ambientEvents = useCortexStore(s => s.ambientEvents)
  const activeNodes = useCortexStore(s => s.activeNodes)
  const inflightCount = useCortexStore(s => s.inflightCount)
  const inlineSessions = useCortexStore(s => s.inlineSessions)
  const addUserMessage = useCortexStore(s => s.addUserMessage)
  const addAssistantMessage = useCortexStore(s => s.addAssistantMessage)
  const startInflight = useCortexStore(s => s.startInflight)
  const endInflight = useCortexStore(s => s.endInflight)
  const registerCCSession = useCortexStore(s => s.registerCCSession)

  const isWorking = inflightCount > 0
  const isTyping = input.length > 0
  const hasActiveSessions = useMemo(
    () => Array.from(inlineSessions.values()).some(s => s.status === 'running'),
    [inlineSessions],
  )

  // Breath state
  const breathState = isTyping ? 'attentive' : isWorking ? 'flowing' : 'resting'

  const { data: stats } = useQuery({ queryKey: ['kgStats'], queryFn: getKGStats })

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, ambientEvents, inflightCount])

  useEffect(() => { inputRef.current?.focus() }, [])

  // Briefing — only once per app session, not on every page navigation
  useEffect(() => {
    if (briefingLoaded) return
    markBriefingLoaded()
    getCortexBriefing()
      .then(res => { if (res.blocks.length > 0) addAssistantMessage(res.blocks, res.mentionedNodes) })
      .catch(() => {})
  }, [briefingLoaded, markBriefingLoaded, addAssistantMessage])

  // Listen for organism surfacings
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.content || detail?.message) {
        setSurfacings(prev => [...prev.slice(-4), {
          id: crypto.randomUUID(),
          content: detail.content || detail.message,
        }])
      }
    }
    window.addEventListener('ecodia:organism-surfacing', handler)
    return () => window.removeEventListener('ecodia:organism-surfacing', handler)
  }, [])

  // Listen for self-modification proposals
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.reasoning) setSelfModProposal(detail)
    }
    window.addEventListener('ecodia:self-modification', handler)
    return () => window.removeEventListener('ecodia:self-modification', handler)
  }, [])

  // Track CC session completions as ambient events — no LLM round-trip.
  // Cortex sees these as context on the human's next message.
  const reactedSessionsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    for (const [sid, session] of inlineSessions) {
      if ((session.status === 'complete' || session.status === 'error') && !reactedSessionsRef.current.has(sid)) {
        reactedSessionsRef.current.add(sid)
        const summary = session.status === 'complete'
          ? `CC session completed: "${session.initial_prompt?.slice(0, 100) ?? sid}"`
          : `CC session failed: ${session.error_message ?? sid}`
        useCortexStore.getState().pushAmbientEvent({
          kind: session.status === 'complete' ? 'action_success' : 'action_failure',
          summary,
          detail: JSON.stringify({
            sessionId: sid, status: session.status,
            filesChanged: session.files_changed, commitSha: session.commit_sha,
            deployStatus: session.deploy_status, cost: session.cc_cost_usd,
          }),
        })
      }
    }
  }, [inlineSessions])

  // File handlers
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const imageItems = Array.from(e.clipboardData.items).filter(i => i.type.startsWith('image/'))
    if (!imageItems.length) return
    e.preventDefault()
    const files = imageItems.map(i => i.getAsFile()).filter(Boolean) as File[]
    const parsed = await Promise.all(files.map(readFileAsAttachment))
    setAttachments(prev => [...prev, ...parsed])
  }, [])

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const parsed = await Promise.all(Array.from(files).map(readFileAsAttachment))
    setAttachments(prev => [...prev, ...parsed])
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }, [])
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false); await handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Send — NEVER blocks
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text && !attachments.length) return

    const currentAttachments = [...attachments]
    setInput('')
    setAttachments([])
    if (inputRef.current) inputRef.current.style.height = 'auto'

    const userContent = text || `[Attached ${currentAttachments.map(a => a.name).join(', ')}]`
    addUserMessage(userContent, currentAttachments.length ? currentAttachments : undefined)

    startInflight()
    try {
      const currentMessages = useCortexStore.getState().messages
      const apiMessages = currentMessages
        .map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content || (m.blocks?.map(b => {
            if ('title' in b) return (b as { title: string }).title
            if ('message' in b) return (b as { message: string }).message
            return ''
          }).filter(Boolean).join('; ')) || '[response]',
        }))
        .filter(m => m.content.trim())

      // Include recent ambient events so Cortex knows what happened this session
      // (action approvals, dismissals, CC completions, deploys) without an LLM round-trip
      const recentAmbient = useCortexStore.getState().ambientEvents.slice(-20).map(e => ({
        kind: e.kind, summary: e.summary, timestamp: e.timestamp,
      }))

      const res = await sendCortexChat(apiMessages, sessionId, currentAttachments.length ? currentAttachments : undefined, recentAmbient)

      for (const block of res.blocks) {
        if (block.type === 'cc_session') {
          const ccBlock = block as CCSessionBlock
          if (ccBlock.sessionId) {
            getSession(ccBlock.sessionId).then(registerCCSession).catch(() => {})
          }
        }
      }

      addAssistantMessage(res.blocks, res.mentionedNodes)
    } catch (err: any) {
      const detail = err?.response?.data?.error || err?.message || 'Unknown error'
      addAssistantMessage([{ type: 'text', content: `Error: ${detail}` }])
    } finally {
      endInflight()
    }
  }, [input, attachments, sessionId, addUserMessage, addAssistantMessage, startInflight, endInflight, registerCCSession])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  const hasMessages = messages.length > 0
  const canSend = input.trim().length > 0 || attachments.length > 0

  // Build the interleaved river stream
  const stream = useMemo(() => [
    ...messages.map(m => ({ kind: 'message' as const, ts: m.timestamp.getTime(), data: m })),
    ...ambientEvents.map(e => ({ kind: 'event' as const, ts: e.timestamp.getTime(), data: e })),
  ].sort((a, b) => a.ts - b.ts), [messages, ambientEvents])

  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <SpatialLayer z={-40} className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <ConstellationCanvas nodeCount={stats?.totalNodes ?? 0} relCount={stats?.totalRelationships ?? 0} activeNodes={activeNodes} />
      </SpatialLayer>

      {/* Peripheral awareness marks */}
      <PeripheralMarks events={ambientEvents} />

      {/* Drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
          >
            <div className="absolute inset-4 rounded-3xl border-2 border-dashed border-primary/40 bg-primary/[0.03]" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <ImageIcon className="h-6 w-6 text-primary" strokeWidth={1.5} />
              </div>
              <p className="text-sm font-medium text-on-surface">Drop to attach</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The River */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                className="flex flex-col items-center justify-center pt-[18vh] pb-8"
              >
                <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">World Model</span>
                <h1 className="mt-3 font-display text-display-lg font-light text-on-surface">
                  The <em className="not-italic font-normal text-gold">Cortex</em>
                </h1>

                {/* Breath indicator */}
                <div className="mt-8 mb-4">
                  <CortexBreath state={breathState} />
                </div>

                <Undertow inflightCount={inflightCount} hasActiveSessions={hasActiveSessions} />
              </motion.div>
            )}
          </AnimatePresence>

          {hasMessages && (
            <div className="pb-8 pt-6 space-y-3">
              <AnimatePresence initial={false}>
                {stream.map(item =>
                  item.kind === 'message'
                    ? item.data.role === 'user'
                      ? <RiverVoice key={item.data.id} message={item.data} />
                      : <RiverResponse key={item.data.id} message={item.data} isLast={item.data.id === messages[messages.length - 1]?.id} />
                    : <RiverEvent key={item.data.id} event={item.data} />
                )}
              </AnimatePresence>

              {/* Organism surfacings — teal accent, proactive */}
              <AnimatePresence>
                {surfacings.map(s => (
                  <OrganismSurfacing
                    key={s.id}
                    content={s.content}
                    onAcknowledge={() => setSurfacings(prev => prev.filter(x => x.id !== s.id))}
                  />
                ))}
              </AnimatePresence>

              {/* Self-modification proposal */}
              <AnimatePresence>
                {selfModProposal && (
                  <SelfModPanel
                    proposal={selfModProposal}
                    onApprove={() => {
                      reactToCortex('User approved self-modification', JSON.stringify(selfModProposal))
                      setSelfModProposal(null)
                    }}
                    onExpand={() => {
                      reactToCortex('User wants more detail on self-modification proposal', JSON.stringify(selfModProposal))
                    }}
                  />
                )}
              </AnimatePresence>

              {/* Breath + Undertow between messages and input */}
              <div className="flex flex-col items-center py-2">
                <CortexBreath state={breathState} />
                <Undertow inflightCount={inflightCount} hasActiveSessions={hasActiveSessions} />
                {inflightCount > 1 && (
                  <span className="text-[9px] font-mono text-on-surface-muted/25 mt-1">{inflightCount} threads</span>
                )}
              </div>

              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar — ALWAYS active, never disabled */}
      <SpatialLayer z={20} className="relative z-10">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
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

          <div className="glass-elevated rounded-2xl transition-all focus-within:shadow-glass-hover">
            <div className="flex items-end gap-2 px-4 py-3.5">
              <label htmlFor={fileInputId}
                className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl text-on-surface-muted/40 transition-all hover:bg-surface-container hover:text-on-surface-muted"
              >
                <Paperclip className="h-4 w-4" strokeWidth={1.75} />
              </label>
              <input id={fileInputId} ref={fileInputRef} type="file" multiple
                accept="image/*,.pdf,.txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.go,.rs,.sh,.yaml,.yml,.toml,.sql,.html,.css,.xml,.doc,.docx,.xls,.xlsx"
                className="sr-only" onChange={e => e.target.files && handleFiles(e.target.files)}
              />
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={ghostPrompt}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-on-surface placeholder-on-surface-muted/30 outline-none leading-relaxed"
                style={{ maxHeight: 200 }}
              />
              <motion.button
                onClick={handleSend}
                disabled={!canSend}
                whileTap={canSend ? { scale: 0.92 } : {}}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all bg-primary/10 text-primary disabled:opacity-0 disabled:scale-90 hover:bg-primary/18 active:bg-primary/22"
              >
                <ArrowUp className="h-4 w-4" strokeWidth={2} />
              </motion.button>
            </div>
          </div>

          {stats && (
            <div className="mt-2 flex items-center justify-center gap-5">
              <div className="flex items-center gap-1.5 text-on-surface-muted/30">
                <Network className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-mono text-[10px]">{stats.totalNodes} nodes</span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-muted/30">{stats.totalRelationships} edges</span>
              <span className="font-mono text-[10px] text-on-surface-muted/30">{stats.labelBreakdown?.length ?? 0} types</span>
            </div>
          )}
        </div>
      </SpatialLayer>
    </div>
  )
}
