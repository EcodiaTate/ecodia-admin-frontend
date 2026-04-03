/**
 * ActionCard — proposed action from the Cortex.
 *
 * Outcomes feed ambient events. No LLM round-trip on action completion —
 * Cortex sees ambient events as context on the human's next message.
 */
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { executeCortexAction } from '@/api/cortex'
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
        const s = useCortexStore.getState()
        s.registerCCSession(session)
        s.addAssistantMessage([{ type: 'cc_session', sessionId: session.id, title: block.title }])
        s.pushAmbientEvent({ kind: 'action_success', summary: `CC session started: ${block.title}` })
        setResult('Running')
        setState('done')
      } else {
        const res = await executeCortexAction(block.action, block.params)
        const detail = JSON.stringify(res)
        useCortexStore.getState().pushAmbientEvent({
          kind: res.success !== false ? 'action_success' : 'action_failure',
          summary: `${block.action.replace(/_/g, ' ')}: ${res.message}`,
          detail,
        })
        setResult(res.message)
        setState('done')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed'
      const detail = err instanceof Error && 'response' in err
        ? JSON.stringify((err as { response?: { data?: unknown } }).response?.data)
        : msg
      useCortexStore.getState().pushAmbientEvent({ kind: 'action_failure', summary: `${block.action.replace(/_/g, ' ')} failed: ${msg}`, detail })
      setResult(msg)
      setFailed(true)
      setState('done')
    }
  }

  function handleDismiss() {
    setState('dismissed')
    useCortexStore.getState().pushAmbientEvent({ kind: 'action_dismissed', summary: `${block.title} dismissed` })
  }

  if (state === 'dismissed') return null

  if (state === 'done') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-6 w-6 items-center justify-center rounded-xl ${failed ? 'bg-error/10' : 'bg-secondary/10'}`}>
            {failed ? <XCircle className="h-3 w-3 text-error" strokeWidth={1.75} /> : <CheckCircle2 className="h-3 w-3 text-secondary" strokeWidth={1.75} />}
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
            <Loader2 className="h-4 w-4 animate-spin text-primary" strokeWidth={1.75} />
          ) : (
            <>
              <button onClick={handleDismiss}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-muted/50 transition-colors hover:bg-surface-container hover:text-on-surface-muted"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
              <button onClick={handleApprove}
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
