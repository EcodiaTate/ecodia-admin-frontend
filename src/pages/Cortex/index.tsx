import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getKGStats } from '@/api/knowledgeGraph'
import { sendCortexChat, getCortexBriefing } from '@/api/cortex'
import { useCortexStore } from '@/store/cortexStore'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUp, Brain, Sparkles, Network, Paperclip,
  X, FileText, Image as ImageIcon, File, Trash2,
} from 'lucide-react'
import { ConstellationCanvas } from './ConstellationCanvas'
import { BlockRenderer } from './blocks/BlockRenderer'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { ChatMessage, AttachedFile } from '@/types/cortex'
import { useCortexStore as useStore } from '@/store/cortexStore'

// ─── File helpers ────────────────────────────────────────────────────────────

function isImage(type: string) {
  return type.startsWith('image/')
}

function isText(type: string) {
  return (
    type.startsWith('text/') ||
    type === 'application/json' ||
    type === 'application/xml' ||
    type === 'application/javascript'
  )
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

async function readFileAsAttachment(file: File): Promise<AttachedFile> {
  const id = crypto.randomUUID()

  if (isImage(file.type)) {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target!.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    return { id, name: file.name, type: file.type, size: file.size, dataUrl }
  }

  if (isText(file.type) || file.name.match(/\.(md|txt|csv|json|ts|tsx|js|jsx|py|go|rs|sh|yaml|yml|toml|sql|html|css|xml)$/i)) {
    const text = await file.text()
    return { id, name: file.name, type: file.type || 'text/plain', size: file.size, text }
  }

  // For PDFs and other docs — just send name/type/size, backend handles
  return { id, name: file.name, type: file.type || 'application/octet-stream', size: file.size }
}

// ─── Attachment chip ──────────────────────────────────────────────────────────

function AttachmentChip({ file, onRemove }: { file: AttachedFile; onRemove: () => void }) {
  if (file.dataUrl) {
    return (
      <div className="group relative flex-shrink-0">
        <img
          src={file.dataUrl}
          alt={file.name}
          className="h-16 w-16 rounded-xl object-cover border border-black/8"
        />
        <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors" />
        <button
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full
            bg-on-surface text-surface shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-2.5 w-2.5" strokeWidth={2.5} />
        </button>
        <div className="absolute bottom-1 left-1 right-1 overflow-hidden">
          <p className="truncate rounded-md bg-black/40 px-1 py-0.5 text-[9px] text-white leading-tight">
            {file.name}
          </p>
        </div>
      </div>
    )
  }

  const Icon = file.type.includes('pdf') ? FileText : file.type.startsWith('text/') ? FileText : File

  return (
    <div className="group relative flex items-center gap-2 rounded-xl border border-black/8 bg-surface-container-low px-3 py-2 flex-shrink-0">
      <Icon className="h-4 w-4 text-on-surface-muted/60 flex-shrink-0" strokeWidth={1.5} />
      <div className="min-w-0">
        <p className="max-w-[120px] truncate text-xs font-medium text-on-surface">{file.name}</p>
        <p className="text-[10px] text-on-surface-muted/50">{formatBytes(file.size)}</p>
      </div>
      <button
        onClick={onRemove}
        className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-on-surface-muted/40
          hover:bg-error/10 hover:text-error transition-colors"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>
    </div>
  )
}

// ─── Inline attachment preview in user bubble ──────────────────────────────

function UserAttachments({ attachments }: { attachments: AttachedFile[] }) {
  if (!attachments.length) return null
  return (
    <div className="mb-2 flex flex-wrap gap-2 justify-end">
      {attachments.map(a => a.dataUrl ? (
        <img
          key={a.id}
          src={a.dataUrl}
          alt={a.name}
          className="h-24 w-24 rounded-xl object-cover border border-black/8"
        />
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CortexPage() {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()

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

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isThinking])

  // Focus
  useEffect(() => { inputRef.current?.focus() }, [])

  // Briefing
  useEffect(() => {
    if (briefingLoaded) return
    setBriefingLoaded(true)
    getCortexBriefing()
      .then(res => { if (res.blocks.length > 0) addAssistantMessage(res.blocks, res.mentionedNodes) })
      .catch(() => {})
  }, [briefingLoaded, setBriefingLoaded, addAssistantMessage])

  // Paste images
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(i => i.type.startsWith('image/'))
    if (!imageItems.length) return
    e.preventDefault()
    const files = imageItems.map(i => i.getAsFile()).filter(Boolean) as File[]
    const parsed = await Promise.all(files.map(readFileAsAttachment))
    setAttachments(prev => [...prev, ...parsed])
  }, [])

  // File picker
  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const parsed = await Promise.all(arr.map(readFileAsAttachment))
    setAttachments(prev => [...prev, ...parsed])
  }, [])

  // Drag-drop on the whole page
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false)
  }, [])
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Send
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if ((!text && !attachments.length) || isThinking) return

    const currentAttachments = [...attachments]
    setInput('')
    setAttachments([])
    if (inputRef.current) inputRef.current.style.height = 'auto'

    addUserMessage(text || '[attachment]', currentAttachments.length ? currentAttachments : undefined)
    setThinking(true)

    try {
      const currentMessages = useStore.getState().messages
      const apiMessages = currentMessages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      const res = await sendCortexChat(apiMessages, sessionId, currentAttachments.length ? currentAttachments : undefined)
      addAssistantMessage(res.blocks, res.mentionedNodes)
    } catch {
      addAssistantMessage([{ type: 'text', content: 'The Cortex encountered an error. The knowledge graph may be unreachable.' }])
    } finally {
      setThinking(false)
      inputRef.current?.focus()
    }
  }, [input, attachments, isThinking, sessionId, addUserMessage, addAssistantMessage, setThinking])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

  const hasMessages = messages.length > 0
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !isThinking

  return (
    <div
      className="relative flex h-full flex-col"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Constellation background */}
      <SpatialLayer z={-40} className="pointer-events-none fixed inset-0 z-0 opacity-30">
        <ConstellationCanvas
          nodeCount={stats?.totalNodes ?? 0}
          relCount={stats?.totalRelationships ?? 0}
          activeNodes={activeNodes}
        />
      </SpatialLayer>

      {/* Drag-drop overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
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

      {/* Chat area */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">

          {/* Hero — only when empty */}
          <AnimatePresence>
            {!hasMessages && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
                className="flex flex-col items-center justify-center pt-[18vh] pb-8"
              >
                <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
                  World Model
                </span>
                <h1 className="mt-3 font-display text-display-lg font-light text-on-surface">
                  The <em className="not-italic font-normal text-gold">Cortex</em>
                </h1>
                <p className="mt-4 text-sm text-on-surface-muted/50 text-center max-w-sm leading-relaxed">
                  Your unified control centre. Ask anything, attach files, and let the world model work.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {hasMessages && (
            <div className="pb-8 pt-6 space-y-6">
              {messages.map((msg, i) => (
                <MessageBubble key={msg.id} message={msg} isLast={i === messages.length - 1} />
              ))}

              {/* Thinking */}
              <AnimatePresence>
                {isThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-3 pl-1"
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-xl bg-primary/8">
                      <Brain className="h-3 w-3 text-primary animate-pulse" strokeWidth={1.75} />
                    </div>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.span
                          key={i}
                          className="h-1.5 w-1.5 rounded-full bg-primary/30"
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <SpatialLayer z={20} className="relative z-10">
        <div className="mx-auto max-w-3xl px-6 py-4">

          {/* Attachment previews */}
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
                    <AttachmentChip
                      key={a.id}
                      file={a}
                      onRemove={() => setAttachments(prev => prev.filter(f => f.id !== a.id))}
                    />
                  ))}
                  {attachments.length > 1 && (
                    <button
                      onClick={() => setAttachments([])}
                      className="flex items-center gap-1 self-end rounded-lg px-2 py-1 text-[10px] text-on-surface-muted/50 hover:text-error transition-colors"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.75} />
                      Clear all
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input box */}
          <div className="glass-elevated rounded-2xl transition-all focus-within:shadow-glass-hover">
            <div className="flex items-end gap-2 px-4 py-3.5">

              {/* File attach button */}
              <label
                htmlFor={fileInputId}
                className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl
                  text-on-surface-muted/40 transition-all hover:bg-surface-container hover:text-on-surface-muted"
                title="Attach files, images, documents"
              >
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

              {/* Text area */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder="Ask anything, attach files, paste images..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-on-surface placeholder-on-surface-muted/40 outline-none leading-relaxed"
                style={{ maxHeight: 200 }}
              />

              {/* Send button */}
              <motion.button
                onClick={handleSend}
                disabled={!canSend}
                whileTap={canSend ? { scale: 0.92 } : {}}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl transition-all
                  bg-primary/10 text-primary
                  disabled:opacity-0 disabled:scale-90
                  hover:bg-primary/18 active:bg-primary/22"
              >
                {isThinking
                  ? <Sparkles className="h-3.5 w-3.5 animate-pulse" strokeWidth={1.75} />
                  : <ArrowUp className="h-4 w-4" strokeWidth={2} />
                }
              </motion.button>
            </div>
          </div>

          {/* Stats bar */}
          {stats && (
            <div className="mt-2 flex items-center justify-center gap-5">
              <div className="flex items-center gap-1.5 text-on-surface-muted/30">
                <Network className="h-3 w-3" strokeWidth={1.5} />
                <span className="font-mono text-[10px]">{stats.totalNodes} nodes</span>
              </div>
              <span className="font-mono text-[10px] text-on-surface-muted/30">
                {stats.totalRelationships} edges
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

// ─── Message Bubble ──────────────────────────────────────────────────────────

function MessageBubble({ message, isLast }: { message: ChatMessage; isLast: boolean }) {
  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 22 }}
        className="flex justify-end"
      >
        <div className="max-w-[82%]">
          {message.attachments && <UserAttachments attachments={message.attachments} />}
          {message.content && message.content !== '[attachment]' && (
            <div className="rounded-2xl rounded-br-lg bg-primary/8 px-5 py-3.5">
              <p className="text-sm leading-relaxed text-on-surface">{message.content}</p>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // Assistant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 22, delay: 0.04 }}
      className="max-w-full"
    >
      {/* Cortex label */}
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
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 80, damping: 22, delay: isLast ? i * 0.05 : 0 }}
          >
            <BlockRenderer block={block} />
          </motion.div>
        ))}

        {/* Fallback */}
        {(!message.blocks || message.blocks.length === 0) && message.content && (
          <div className="
            text-sm leading-[1.8] text-on-surface-variant
            [&_p]:my-0 [&_p+p]:mt-3
            [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5
            [&_strong]:text-on-surface [&_strong]:font-semibold
            [&_code]:rounded-md [&_code]:bg-black/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.78em] [&_code]:text-primary/90
          ">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  )
}
