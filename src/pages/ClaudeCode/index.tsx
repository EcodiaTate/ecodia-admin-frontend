import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, createSession } from '@/api/claudeCode'
import { SessionList } from './SessionList'
import { CCTerminal } from './Terminal'
import type { CCSession } from '@/types/claudeCode'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'

export default function ClaudeCodePage() {
  const { sessionId } = useParams()
  const [selectedSession, setSelectedSession] = useState<CCSession | null>(null)
  const [prompt, setPrompt] = useState('')
  const queryClient = useQueryClient()

  const activeId = sessionId || selectedSession?.id
  const { data: session } = useQuery({
    queryKey: ['ccSession', activeId],
    queryFn: () => getSession(activeId!),
    enabled: !!activeId,
    refetchInterval: (query) => {
      const s = query.state.data
      return s?.status === 'running' || s?.status === 'initializing' ? 3000 : false
    },
  })

  const create = useMutation({
    mutationFn: () => createSession({ initialPrompt: prompt }),
    onSuccess: (data) => {
      setSelectedSession(data)
      setPrompt('')
      queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
      toast.success('Session started')
    },
  })

  if (session) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="max-w-5xl space-y-6"
      >
        <button
          onClick={() => setSelectedSession(null)}
          className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to sessions
        </button>
        <CCTerminal session={session} />
      </motion.div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-12">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
          AI Operations
        </span>
        <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
          Autonomy <em className="not-italic font-normal text-primary">Core</em>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-on-surface-muted">
          Deploying ambient logic structures across the Ecodia network. Monitoring autonomous nodes and resource allocation.
        </p>
      </div>

      <div className="glass rounded-3xl p-8">
        <h2 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">New Decision</h2>
        <div className="mt-4 flex gap-3">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter initial prompt for autonomous session..."
            className="flex-1 rounded-xl bg-surface-container-low px-5 py-3 text-sm text-on-surface placeholder-on-surface-muted transition-colors focus:bg-surface-container-lowest focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && prompt.trim() && create.mutate()}
          />
          <button
            onClick={() => create.mutate()}
            disabled={!prompt.trim() || create.isPending}
            className="btn-primary-gradient flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium disabled:opacity-40"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
            Deploy
          </button>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-6 text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Recent Decisions</h2>
        <div className="glass rounded-3xl overflow-hidden">
          <SessionList onSelect={setSelectedSession} />
        </div>
      </div>
    </div>
  )
}
