import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getKGStats } from '@/api/knowledgeGraph'
import { sendCortexChat, getCortexBriefing } from '@/api/cortex'
import { useCortexStore } from '@/store/cortexStore'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Brain, Sparkles, Network } from 'lucide-react'
import { ConstellationCanvas } from './ConstellationCanvas'
import { BlockRenderer } from './blocks/BlockRenderer'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import type { ChatMessage } from '@/types/cortex'

export default function CortexPage() {
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    activeNodes,
    isThinking,
    sessionId,
    briefingLoaded,
    addUserMessage,
    addAssistantMessage,
    setThinking,
    setBriefingLoaded,
  } = useCortexStore()

  const { data: stats } = useQuery({
    queryKey: ['kgStats'],
    queryFn: getKGStats,
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Load proactive briefing on first mount
  useEffect(() => {
    if (briefingLoaded) return
    setBriefingLoaded(true)

    getCortexBriefing()
      .then(res => {
        if (res.blocks.length > 0) {
          addAssistantMessage(res.blocks, res.mentionedNodes)
        }
      })
      .catch(() => { /* silent — briefing is optional */ })
  }, [briefingLoaded, setBriefingLoaded, addAssistantMessage])

  // Send message
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isThinking) return

    setInput('')
    addUserMessage(text)
    setThinking(true)

    // Resize textarea back to single line
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }

    try {
      // Build conversation history for the API
      const currentMessages = useCortexStore.getState().messages
      const apiMessages = currentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))

      const res = await sendCortexChat(apiMessages, sessionId)
      addAssistantMessage(res.blocks, res.mentionedNodes)
    } catch {
      addAssistantMessage([{
        type: 'text',
        content: 'The Cortex encountered an error processing that request. The knowledge graph may be unreachable.',
      }])
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }, [input, isThinking, sessionId, addUserMessage, addAssistantMessage, setThinking])

  // Handle keyboard
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  // Auto-resize textarea
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [])

  const hasMessages = messages.length > 0

  return (
    <div className="relative flex h-full flex-col">
      {/* Ambient constellation — deep background */}
      <SpatialLayer z={-40} className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <ConstellationCanvas
          nodeCount={stats?.totalNodes ?? 0}
          relCount={stats?.totalRelationships ?? 0}
          activeNodes={activeNodes}
        />
      </SpatialLayer>

      {/* Scrollable chat area */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">
          {/* Header — only when no messages */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { type: 'spring', stiffness: 200, damping: 25 } }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                className="flex flex-col items-center justify-center pt-[18vh]"
              >
                <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
                  World Model
                </span>
                <h1 className="mt-3 font-display text-display-lg font-light text-on-surface">
                  The <em className="not-italic font-normal text-gold">Cortex</em>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {hasMessages && (
            <div className="pb-8 pt-6">
              <div className="space-y-6">
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}

                {/* Thinking indicator */}
                <AnimatePresence>
                  {isThinking && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="flex items-center gap-3 pl-1"
                    >
                      <div className="relative h-7 w-7">
                        <div className="absolute inset-0 animate-pulse-glow rounded-full bg-primary/10" />
                        <div className="absolute inset-1.5 rounded-full bg-primary/20 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                      </div>
                      <span className="text-xs text-on-surface-muted">
                        Tracing through the world model...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar — floats forward */}
      <SpatialLayer z={20} className="relative z-10">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <div className="glass-elevated rounded-2xl transition-all focus-within:shadow-glass-hover">
            <div className="flex items-end gap-3 px-5 py-3.5">
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your world..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-on-surface placeholder-on-surface-muted/50 outline-none leading-relaxed"
                style={{ maxHeight: 160 }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all hover:bg-primary/15 disabled:opacity-0 disabled:scale-90"
              >
                {isThinking ? (
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.75} />
                ) : (
                  <ArrowUp className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {/* Ambient stats */}
          {stats && (
            <div className="mt-2.5 flex items-center justify-center gap-6">
              <div className="flex items-center gap-1.5 text-on-surface-muted/30">
                <Network className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-mono text-[10px]">{stats.totalNodes} nodes</span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-muted/30">
                {stats.totalRelationships} connections
              </span>
              <span className="font-mono text-[10px] text-on-surface-muted/30">
                {stats.labelBreakdown.length} types
              </span>
            </div>
          )}
        </div>
      </SpatialLayer>
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.02 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] rounded-2xl rounded-br-xl bg-primary/8 px-5 py-3.5">
          <p className="text-sm leading-relaxed text-on-surface">{message.content}</p>
        </div>
      </motion.div>
    )
  }

  // Assistant message — render structured blocks
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20, delay: 0.05 }}
      className="max-w-full"
    >
      {/* Cortex indicator */}
      <div className="flex items-center gap-2 mb-3 pl-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/8">
          <Brain className="h-3 w-3 text-primary" strokeWidth={1.75} />
        </div>
        <span className="text-label-sm uppercase tracking-[0.08em] text-on-surface-muted/50">
          Cortex
        </span>
      </div>

      {/* Blocks */}
      <div className="space-y-3 pl-1">
        {message.blocks?.map((block, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 20, delay: i * 0.06 }}
          >
            <BlockRenderer block={block} />
          </motion.div>
        ))}

        {/* Fallback: if no blocks but has content */}
        {(!message.blocks || message.blocks.length === 0) && message.content && (
          <div className="text-sm leading-[1.8] text-on-surface-variant">
            {message.content.split('\n\n').map((para, i) => (
              <p key={i} className={i > 0 ? 'mt-3' : ''}>{para}</p>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
