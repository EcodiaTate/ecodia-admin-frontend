/**
 * OS Chat — Practical operations interface.
 * Separate from organism Cortex. No constellation, no breath, no surfacings.
 * Clean workspace-scoped chat with task persistence.
 */
import { useState, useRef, useEffect, useCallback, useId } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, Paperclip, FileText, X, Trash2, Loader2, CheckCircle2, AlertCircle, HelpCircle, Image as ImageIcon } from 'lucide-react'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useOSCortexStore } from '@/store/osCortexStore'
import { runOSTask, getWorkspaces, getTask } from '@/api/os'
import { uploadCSV } from '@/api/bookkeeping'
import type { OSBlock, OSChatMessage } from '@/types/os'
import type { AttachedFile } from '@/types/cortex'

// ─── Ghost prompts per workspace ─────────────────────────────────────
const WORKSPACE_GHOSTS: Record<string, string[]> = {
  bookkeeping: [
    'Import a bank CSV...',
    'Show me pending transactions',
    'Generate the BAS for last quarter',
    'Categorize all pending transactions',
    'What\'s the current trial balance?',
  ],
  email: [
    'Triage my inbox',
    'Draft a reply to...',
    'Archive everything from...',
  ],
  crm: [
    'Show active leads',
    'Create a new project for...',
    'Update pipeline status',
  ],
  admin: [
    'Check PM2 process status',
    'Show disk usage',
    'Pull latest on VPS',
  ],
}

function useGhostPrompt(workspace: string): string {
  const [idx, setIdx] = useState(0)
  const prompts = WORKSPACE_GHOSTS[workspace] || ['Ask anything...']
  useEffect(() => {
    setIdx(0)
    const t = setInterval(() => setIdx(i => (i + 1) % prompts.length), 6000)
    return () => clearInterval(t)
  }, [workspace, prompts.length])
  return prompts[idx % prompts.length]
}

// ─── File helpers (shared with organism cortex) ──────────────────────
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

// ─── Block Renderers ─────────────────────────────────────────────────

function OSBlockRenderer({ block }: { block: OSBlock }) {
  switch (block.type) {
    case 'text':
      return (
        <div className="text-sm leading-[1.8] text-on-surface-variant [&_p]:my-0 [&_p+p]:mt-3 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:my-0.5 [&_strong]:text-on-surface [&_strong]:font-semibold [&_code]:rounded-md [&_code]:bg-black/6 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.78em] [&_code]:text-primary/90">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{block.content}</ReactMarkdown>
        </div>
      )

    case 'action_card':
      return (
        <div className="flex items-center gap-2 rounded-xl border border-primary/10 bg-primary/[0.03] px-3 py-2">
          <Loader2 className="h-3.5 w-3.5 text-primary/50 animate-spin" strokeWidth={1.75} />
          <span className="text-xs text-on-surface-variant/70 font-mono">{block.action}</span>
        </div>
      )

    case 'action_result':
      return (
        <div className={`flex items-start gap-2 rounded-xl border px-3 py-2 ${
          block.success ? 'border-secondary/15 bg-secondary/[0.03]' : 'border-error/15 bg-error/[0.03]'
        }`}>
          {block.success
            ? <CheckCircle2 className="h-3.5 w-3.5 text-secondary/60 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
            : <AlertCircle className="h-3.5 w-3.5 text-error/60 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
          }
          <div className="min-w-0">
            <span className="text-xs font-mono text-on-surface-variant/60">{block.action}</span>
            {block.success && block.result != null && (
              <p className="text-xs text-on-surface-variant/50 mt-0.5 break-all">
                {typeof block.result === 'string' ? block.result : JSON.stringify(block.result as Record<string, unknown>).slice(0, 300)}
              </p>
            )}
            {!block.success && block.error && (
              <p className="text-xs text-error/70 mt-0.5">{block.error}</p>
            )}
          </div>
        </div>
      )

    case 'question':
      return (
        <div className="flex items-start gap-2 rounded-xl border border-gold/20 bg-gold/[0.04] px-4 py-3">
          <HelpCircle className="h-4 w-4 text-gold/60 mt-0.5 flex-shrink-0" strokeWidth={1.75} />
          <p className="text-sm text-on-surface-variant">{block.content}</p>
        </div>
      )

    case 'done':
      return (
        <div className="flex items-center gap-2 rounded-xl border border-secondary/15 bg-secondary/[0.03] px-3 py-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-secondary/60" strokeWidth={1.75} />
          <span className="text-xs text-secondary/70">{block.summary}</span>
        </div>
      )

    default:
      return null
  }
}

// ─── Message Renderers ───────────────────────────────────────────────

function OSUserMessage({ message }: { message: OSChatMessage }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-2"
    >
      <p className="text-sm leading-relaxed text-on-surface font-medium">{message.content}</p>
    </motion.div>
  )
}

function OSAssistantMessage({ message }: { message: OSChatMessage }) {
  // Filter out action_cards that have a corresponding action_result (already executed)
  const blocks = message.blocks || []
  const executedActions = new Set(
    blocks.filter(b => b.type === 'action_result').map(b => (b as { action: string }).action)
  )
  const visibleBlocks = blocks.filter(b =>
    b.type !== 'action_card' || !executedActions.has((b as { action: string }).action)
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-2 space-y-2"
    >
      {visibleBlocks.map((block, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <OSBlockRenderer block={block} />
        </motion.div>
      ))}
      {(!message.blocks || message.blocks.length === 0) && message.content && (
        <div className="text-sm leading-[1.8] text-on-surface-variant">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        </div>
      )}
    </motion.div>
  )
}

// ─── Workspace Tabs ──────────────────────────────────────────────────

function WorkspaceTabs() {
  const workspace = useOSCortexStore(s => s.workspace)
  const setWorkspace = useOSCortexStore(s => s.setWorkspace)
  const { data: workspaces } = useQuery({
    queryKey: ['os-workspaces'],
    queryFn: getWorkspaces,
    staleTime: 60_000,
  })

  return (
    <div className="flex items-center gap-1 px-1">
      {(workspaces || []).map(ws => (
        <button
          key={ws.name}
          onClick={() => setWorkspace(ws.name)}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
            workspace === ws.name
              ? 'bg-primary/12 text-primary shadow-sm'
              : 'text-on-surface-muted/50 hover:text-on-surface-muted/70 hover:bg-surface-container'
          }`}
        >
          {ws.label}
        </button>
      ))}
    </div>
  )

}

// ─── Recent Tasks ────────────────────────────────────────────────────

function SessionControls() {
  const clearMessages = useOSCortexStore(s => s.clearMessages)
  const messages = useOSCortexStore(s => s.messages)

  if (messages.length === 0) return null

  return (
    <div className="flex items-center px-1">
      <button
        onClick={() => clearMessages()}
        className="rounded-lg px-2.5 py-1 text-[10px] font-mono text-on-surface-muted/40 hover:text-on-surface-muted/60 hover:bg-surface-container transition-all"
      >
        clear
      </button>
    </div>
  )
}

// ─── Main OS Chat ────────────────────────────────────────────────────

export default function OSChat() {
  const [input, setInput] = useState('')
  const [attachments, setAttachments] = useState<AttachedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileInputId = useId()

  const workspace = useOSCortexStore(s => s.workspace)
  const taskId = useOSCortexStore(s => s.taskId)
  const messages = useOSCortexStore(s => s.messages)
  const loading = useOSCortexStore(s => s.loading)
  const addUserMessage = useOSCortexStore(s => s.addUserMessage)
  const addAssistantMessage = useOSCortexStore(s => s.addAssistantMessage)
  const setTaskId = useOSCortexStore(s => s.setTaskId)
  const setLoading = useOSCortexStore(s => s.setLoading)

  const loadHistory = useOSCortexStore(s => s.loadHistory)

  const ghostPrompt = useGhostPrompt(workspace)
  const canSend = (input.trim().length > 0 || attachments.length > 0) && !loading

  // On workspace change: if we have a taskId but no messages, load from backend
  useEffect(() => {
    if (taskId && messages.length === 0) {
      getTask(taskId).then(task => {
        if (task?.history) {
          const msgs: OSChatMessage[] = task.history
            .filter((t: { role: string }) => t.role === 'user' || t.role === 'assistant')
            .map((t: { role: string; content: string; blocks?: OSBlock[]; ts?: string }) => ({
              id: crypto.randomUUID(),
              role: t.role as 'user' | 'assistant',
              content: t.content || '',
              blocks: t.blocks,
              timestamp: t.ts ? new Date(t.ts) : new Date(),
            }))
          if (msgs.length > 0) loadHistory(msgs)
        }
      }).catch(() => {})
    }
  }, [taskId, workspace]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => { inputRef.current?.focus() }, [workspace])

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

  // Send
  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text && !attachments.length) return

    const currentAttachments = [...attachments]
    setInput('')
    setAttachments([])
    if (inputRef.current) inputRef.current.style.height = 'auto'

    // Intercept CSV files — ingest directly, don't dump into the prompt
    const csvFiles = currentAttachments.filter(a => a.name?.toLowerCase().endsWith('.csv') && a.text)
    const nonCsvAttachments = currentAttachments.filter(a => !a.name?.toLowerCase().endsWith('.csv') || !a.text)

    let fullContent = text
    const ingestResults: string[] = []

    if (csvFiles.length > 0) {
      addUserMessage(text || `Importing ${csvFiles.map(a => a.name).join(', ')}...`)
      setLoading(true)

      for (const csv of csvFiles) {
        try {
          // Create a File object from the text content for the upload API
          const file = new File([csv.text!], csv.name, { type: 'text/csv' })
          const result = await uploadCSV(file)
          ingestResults.push(`${csv.name}: ${result.created} imported, ${result.duplicates} duplicates, ${result.total_parsed} parsed`)
        } catch (err: any) {
          ingestResults.push(`${csv.name}: import failed — ${err?.response?.data?.error || err?.message || 'unknown error'}`)
        }
      }

      // Tell the AI what happened so it can act on the imported transactions
      fullContent = `${text ? text + '\n\n' : ''}[CSV import results]\n${ingestResults.join('\n')}\n\nPlease review and categorize the imported transactions.`
    }

    // For non-CSV text files, still append (they're small, like notes)
    for (const a of nonCsvAttachments) {
      if (a.text) {
        fullContent = `${fullContent}\n\n[File: ${a.name}]\n${a.text}`
      }
    }

    if (!csvFiles.length) {
      addUserMessage(fullContent || `[Attached ${currentAttachments.map(a => a.name).join(', ')}]`)
      setLoading(true)
    } else if (ingestResults.length) {
      // Show import results immediately
      addAssistantMessage([{ type: 'text', content: ingestResults.join('\n') }])
    }

    try {
      const result = await runOSTask(
        workspace,
        [{ role: 'user', content: fullContent }],
        taskId || undefined,
      )

      // Update task ID if new
      if (result.taskId && result.taskId !== taskId) {
        setTaskId(result.taskId)
      }

      addAssistantMessage(result.blocks)
    } catch (err: any) {
      const isNetworkError = !err?.response && (err?.message === 'Network Error' || err?.code === 'ECONNABORTED' || err?.code === 'ERR_NETWORK')

      if (isNetworkError && taskId) {
        // Connection dropped (nginx timeout) but backend may still be working.
        // Poll the task session to get results.
        addAssistantMessage([{ type: 'text', content: 'Connection timed out — checking if the task completed...' }])
        try {
          // Wait a moment then check
          await new Promise(r => setTimeout(r, 3000))
          const task = await getTask(taskId)
          if (task?.history?.length) {
            const lastAssistant = [...task.history].reverse().find((t: { role: string }) => t.role === 'assistant')
            if (lastAssistant?.blocks) {
              addAssistantMessage(lastAssistant.blocks)
            } else if (lastAssistant?.content) {
              addAssistantMessage([{ type: 'text', content: lastAssistant.content }])
            } else {
              addAssistantMessage([{ type: 'text', content: 'Task is still running. Send another message to continue.' }])
            }
          }
        } catch {
          addAssistantMessage([{ type: 'text', content: 'Still working — send another message to check progress.' }])
        }
      } else {
        const upstream = err?.response?.data?.upstream ? ` | ${JSON.stringify(err.response.data.upstream)}` : ''
        const detail = (err?.response?.data?.error || err?.message || 'Unknown error') + upstream
        addAssistantMessage([{ type: 'text', content: `Error: ${detail}` }])
      }
    } finally {
      setLoading(false)
    }
  }, [input, attachments, workspace, taskId, addUserMessage, addAssistantMessage, setTaskId, setLoading])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }, [])

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

      {/* Header: workspace tabs + tasks */}
      <div className="relative z-10 border-b border-black/5 px-6 py-3 space-y-2">
        <WorkspaceTabs />
        <SessionControls />
      </div>

      {/* Chat stream */}
      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-thin">
        <div className="mx-auto max-w-3xl px-6">
          {messages.length === 0 && (
            <div className="flex items-center justify-center pt-[20vh] pb-8">
              <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted/30">
                {workspace.charAt(0).toUpperCase() + workspace.slice(1)}
              </span>
            </div>
          )}

          {messages.length > 0 && (
            <div className="pb-8 pt-6 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map(msg =>
                  msg.role === 'user'
                    ? <OSUserMessage key={msg.id} message={msg} />
                    : <OSAssistantMessage key={msg.id} message={msg} />
                )}
              </AnimatePresence>

              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-2">
                  <Loader2 className="h-3.5 w-3.5 text-primary/40 animate-spin" strokeWidth={1.75} />
                  <span className="text-xs text-on-surface-muted/40 font-mono">working...</span>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <SpatialLayer z={20} className="relative z-10">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <AnimatePresence>
            {attachments.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mb-2 flex flex-wrap gap-2 px-1">
                  {attachments.map(a => (
                    <div key={a.id} className="group flex items-center gap-2 rounded-xl border border-black/8 bg-surface-container-low px-3 py-2 flex-shrink-0">
                      <FileText className="h-4 w-4 text-on-surface-muted/60 flex-shrink-0" strokeWidth={1.5} />
                      <div className="min-w-0">
                        <p className="max-w-[120px] truncate text-xs font-medium text-on-surface">{a.name}</p>
                        <p className="text-[10px] text-on-surface-muted/50">{formatBytes(a.size)}</p>
                      </div>
                      <button onClick={() => setAttachments(prev => prev.filter(f => f.id !== a.id))} className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-on-surface-muted/40 hover:bg-error/10 hover:text-error transition-colors">
                        <X className="h-3 w-3" strokeWidth={2} />
                      </button>
                    </div>
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
                accept="image/*,.pdf,.txt,.md,.csv,.json,.ts,.tsx,.js,.jsx,.py,.go,.rs,.sh,.yaml,.yml,.toml,.sql,.html,.css,.xml"
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
        </div>
      </SpatialLayer>
    </div>
  )
}
