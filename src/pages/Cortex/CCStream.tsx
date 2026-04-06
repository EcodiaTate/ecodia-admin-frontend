/**
 * CCStream — The unified Claude Code OS interface.
 *
 * Replaces both Organism and OS modes with a single persistent CC session.
 * User messages go to the backend OS session service, which spawns/resumes CC.
 * CC's stream-json output arrives via WebSocket and renders here.
 *
 * Visual language matches the Cortex aesthetic:
 * - User messages: full opacity, zinc-900
 * - CC text: zinc-700, markdown rendered
 * - CC tool use: ambient activity indicators (mono, muted)
 * - CC thinking: collapsible teal blocks
 * - Streaming: live text accumulation with breath animation
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Loader2, RotateCcw, Brain, Wrench, ChevronDown } from 'lucide-react'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useOSSessionStore, type OSSessionMessage } from '@/store/osSessionStore'
import { sendOSMessage, restartOS } from '@/api/osSession'

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

      // CC stream-json types
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
      if (obj.type === 'result') {
        // Final result — already captured via text blocks
      }
    } catch {
      // Not JSON — might be raw text
      if (chunk.trim()) parsed.push({ type: 'unknown', content: chunk.trim() })
    }
  }
  return parsed
}

// ─── Message renderers ──────────────────────────────────────────────

function UserMessage({ message }: { message: OSSessionMessage }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="py-2">
      <p className="text-sm leading-relaxed text-on-surface font-medium">{message.content}</p>
    </motion.div>
  )
}

function AssistantMessage({ message }: { message: OSSessionMessage }) {
  const chunks = message.chunks ? parseStreamChunks(message.chunks) : []
  const textContent = chunks.filter(c => c.type === 'text').map(c => c.content).join('\n\n')
  const toolUses = chunks.filter(c => c.type === 'tool_use')
  const thinkingBlocks = chunks.filter(c => c.type === 'thinking')

  // Fallback to message.content if no parsed chunks
  const displayText = textContent || message.content

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-2 space-y-2">
      {/* Thinking blocks (collapsible) */}
      {thinkingBlocks.map((t, i) => (
        <ThinkingBlock key={`think-${i}`} content={t.content} />
      ))}

      {/* Tool use indicators */}
      {toolUses.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {toolUses.map((t, i) => (
            <div key={`tool-${i}`} className="flex items-center gap-1.5 rounded-lg bg-primary/[0.04] px-2.5 py-1">
              <Wrench className="h-3 w-3 text-primary/40" strokeWidth={1.75} />
              <span className="text-[11px] font-mono text-on-surface-muted/50">{t.toolName || t.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Text response */}
      {displayText && (
        <div className="text-sm leading-[1.8] text-on-surface-variant [&_p]:my-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-on-surface [&_strong]:font-semibold [&_code]:rounded-md [&_code]:bg-black/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.78em] [&_code]:text-primary/90 [&_table]:w-full [&_th]:text-left [&_th]:text-xs [&_th]:font-mono [&_th]:text-on-surface-muted/60 [&_th]:pb-2 [&_td]:text-xs [&_td]:py-1 [&_td]:pr-4">
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
    <motion.div className="rounded-xl border border-primary/8 bg-primary/[0.02] overflow-hidden" layout>
      <button onClick={() => setExpanded(!expanded)} className="flex items-start gap-2 px-3 py-2 w-full text-left">
        <Brain className="h-3.5 w-3.5 text-primary/40 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
        <span className="text-xs text-on-surface-muted/60 leading-relaxed flex-1">{expanded ? content : preview}</span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }}>
          <ChevronDown className="h-3 w-3 text-on-surface-muted/30 flex-shrink-0 mt-0.5" strokeWidth={2} />
        </motion.div>
      </button>
    </motion.div>
  )
}

// ─── Streaming indicator ────────────────────────────────────────────

function StreamingIndicator({ text }: { text: string }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-2 space-y-2">
      {text && (
        <div className="text-sm leading-[1.8] text-on-surface-variant">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Loader2 className="h-3 w-3 text-primary/40 animate-spin" strokeWidth={2} />
        <span className="text-[11px] text-on-surface-muted/40 font-mono">
          {text ? 'working...' : 'thinking...'}
        </span>
      </div>
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
      await sendOSMessage(text)
      // Response arrives via WebSocket — no need to handle here
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      useOSSessionStore.getState().finalizeResponse()
      useOSSessionStore.getState().setStatus('error')
      // Add error as assistant message
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

  return (
    <div className="relative flex h-full flex-col">
      {/* Header */}
      <div className="relative z-10 border-b border-black/5 px-6 py-3 flex items-center justify-between">
        <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted/30">
          Cortex
        </span>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleRestart}
              className="rounded-lg px-2.5 py-1 text-[10px] font-mono text-on-surface-muted/40 hover:text-on-surface-muted/60 hover:bg-surface-container transition-all flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
              new session
            </button>
          )}
        </div>
      </div>

      {/* Chat stream */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">
          {messages.length === 0 && status !== 'streaming' && (
            <div className="flex items-center justify-center pt-[20vh] pb-8">
              <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted/20">
                EcodiaOS
              </span>
            </div>
          )}

          {messages.length > 0 && (
            <div className="pb-8 pt-6 space-y-3">
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

      {/* Input */}
      <SpatialLayer z={20}>
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="glass-elevated rounded-2xl transition-all focus-within:shadow-glass-hover">
            <div className="flex items-end gap-2 px-4 py-3.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
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
        </div>
      </SpatialLayer>
    </div>
  )
}
