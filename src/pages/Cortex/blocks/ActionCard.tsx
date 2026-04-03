/**
 * ActionCard - renders a proposed action from the Cortex.
 *
 * When approved or dismissed, the outcome is:
 * 1. Reflected locally (state → done/dismissed)
 * 2. Pushed as an AmbientEvent into cortexStore so the Cortex brain can see it
 * 3. Forwarded to the Cortex backend - it can then react without the human re-prompting
 *
 * This is how the system flows: approve → result → Cortex observes → Cortex continues.
 * No stop/start. No "what happened?" re-prompting.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { executeCortexAction, sendCortexChat } from '@/api/cortex'
import { createSession } from '@/api/claudeCode'
import { useCortexStore } from '@/store/cortexStore'
import type { ActionCardBlock } from '@/types/cortex'

const URGENCY_STYLES = {
  low: 'bg-surface-container-low/60',
  medium: 'bg-tertiary/5',
  high: 'bg-error/5',
}

const URGENCY_ACCENT = {
  low: 'bg-primary/10 text-primary',
  medium: 'bg-tertiary/10 text-tertiary',
  high: 'bg-error/10 text-error',
}

export function ActionCard({ block }: { block: ActionCardBlock }) {
  const [state, setState] = useState<'idle' | 'executing' | 'done' | 'dismissed'>('idle')
  const [result, setResult] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const store = useCortexStore()

  async function reactToCortex(summary: string, detail?: string) {
    // Don't block the UI on this - fire and forget. The Cortex observes and
    // may or may not respond. If it does, a new assistant message appears.
    if (store.isThinking) return
    store.setThinking(true)
    try {
      const currentMessages = useCortexStore.getState().messages
      const apiMessages = [
        ...currentMessages.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content || '[response]',
        })).filter(m => m.content.trim()),
        // Inject the event as a system observation at the end of the thread
        {
          role: 'user' as const,
          content: `[SYSTEM EVENT] ${summary}${detail ? `\n\nRaw response:\n${detail}` : ''}`,
        },
      ]
      const res = await sendCortexChat(apiMessages, store.sessionId)
      // Only add a response if the Cortex actually has something to say
      // (i.e. not just an empty ack). The backend should return empty blocks
      // if there's nothing useful to add.
      if (res.blocks.length > 0) {
        store.addAssistantMessage(res.blocks, res.mentionedNodes)
      }
    } catch {
      // Silent fail - the ambient reaction is best-effort, not critical
    } finally {
      store.setThinking(false)
    }
  }

  async function handleApprove() {
    setState('executing')
    try {
      if (block.action === 'start_cc_session') {
        const initialPrompt = (block.params.initialPrompt as string | undefined)
          || (block.params.prompt as string | undefined)
          || block.description
        const session = await createSession({
          initialPrompt,
          projectId: block.params.projectId as string | undefined,
          clientId: block.params.clientId as string | undefined,
          workingDir: block.params.workingDir as string | undefined,
        })
        store.registerCCSession(session)
        store.addAssistantMessage([{
          type: 'cc_session',
          sessionId: session.id,
          title: block.title,
        }])
        store.pushAmbientEvent({
          kind: 'action_success',
          summary: `CC session started: ${block.title}`,
          detail: JSON.stringify({ sessionId: session.id, status: session.status }),
        })
        setResult('Running')
        setState('done')
        // No need to react - the inline terminal is now live
      } else {
        const res = await executeCortexAction(block.action, block.params)
        const detail = JSON.stringify(res)
        store.pushAmbientEvent({
          kind: res.success !== false ? 'action_success' : 'action_failure',
          summary: `${block.action.replace(/_/g, ' ')}: ${res.message}`,
          detail,
        })
        setResult(res.message)
        setState('done')
        // Tell the Cortex what happened so it can react intelligently
        reactToCortex(
          `Action "${block.action}" completed: ${res.message}`,
          detail,
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      // Try to extract the response body for richer context
      const detail = err instanceof Error && 'response' in err
        ? JSON.stringify((err as { response?: { data?: unknown } }).response?.data)
        : msg
      store.pushAmbientEvent({
        kind: 'action_failure',
        summary: `${block.action.replace(/_/g, ' ')} failed: ${msg}`,
        detail,
      })
      setResult(msg)
      setFailed(true)
      setState('done')
      // Tell the Cortex so it can diagnose or retry
      reactToCortex(
        `Action "${block.action}" failed: ${msg}`,
        detail,
      )
    }
  }

  function handleDismiss() {
    setState('dismissed')
    store.pushAmbientEvent({
      kind: 'action_dismissed',
      summary: `${block.title} dismissed`,
    })
    // Cortex observes dismissals too - it may want to deprioritise or adjust
    reactToCortex(`Action dismissed by user: "${block.title}" (${block.action})`)
  }

  if (state === 'dismissed') return null

  if (state === 'done') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className={`flex h-6 w-6 items-center justify-center rounded-xl ${failed ? 'bg-error/10' : 'bg-secondary/10'}`}>
            {failed
              ? <XCircle className="h-3 w-3 text-error" strokeWidth={1.75} />
              : <CheckCircle2 className="h-3 w-3 text-secondary" strokeWidth={1.75} />
            }
          </div>
          <span className="text-sm text-on-surface-variant">{result}</span>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 80, damping: 20 }}
      className={`rounded-2xl p-5 ${URGENCY_STYLES[block.urgency]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-label-sm font-medium uppercase tracking-wide ${URGENCY_ACCENT[block.urgency]}`}>
              {block.action.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-sm font-medium text-on-surface">{block.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-muted">{block.description}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {state === 'executing' ? (
            <div className="flex h-8 w-8 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.75} />
            </div>
          ) : (
            <>
              <button
                onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-muted/50 transition-colors hover:bg-surface-container hover:text-on-surface-muted"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button
                onClick={handleApprove}
                className="flex h-8 items-center gap-1.5 rounded-xl bg-primary/10 px-3 text-xs font-medium text-primary transition-colors hover:bg-primary/15"
              >
                <Play className="h-3 w-3" strokeWidth={2} />
                {block.action === 'start_cc_session' ? 'Run' : 'Approve'}
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
