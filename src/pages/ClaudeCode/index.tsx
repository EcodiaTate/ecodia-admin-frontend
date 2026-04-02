import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, createSession, getSessions } from '@/api/claudeCode'
import { useCCSessionStore } from '@/store/ccSessionStore'
import { SessionList } from './SessionList'
import { CCTerminal } from './Terminal'
import type { CCSession } from '@/types/claudeCode'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
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

  const setSession = useCCSessionStore((s) => s.setSession)
  useEffect(() => {
    if (session) setSession(session)
  }, [session, setSession])

  const { data: sessions } = useQuery({
    queryKey: ['ccSessions'],
    queryFn: () => getSessions({ limit: 20 }),
  })

  const sessionList = sessions?.sessions ?? []
  const runningCount = sessionList.filter((s: CCSession) => s.status === 'running' || s.status === 'initializing').length

  const create = useMutation({
    mutationFn: () => createSession({ initialPrompt: prompt }),
    onSuccess: (data) => {
      setSelectedSession(data)
      setPrompt('')
      queryClient.invalidateQueries({ queryKey: ['ccSessions'] })
      toast.success('Session started')
    },
  })

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-10">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Autonomous Execution
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          The <em className="not-italic font-normal text-primary">Factory</em>
        </h1>
        {runningCount > 0 && (
          <p className="mt-2 text-sm text-secondary/60">
            {runningCount} session{runningCount > 1 ? 's' : ''} running
          </p>
        )}
      </SpatialLayer>

      <SpatialLayer z={-5}>
        <AnimatePresence mode="popLayout" initial={false}>
          {session ? (
            <motion.div
              key="terminal"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
              className="space-y-6"
            >
              <button
                onClick={() => setSelectedSession(null)}
                className="flex items-center gap-2 text-sm text-on-surface-muted hover:text-on-surface-variant"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back
              </button>
              <CCTerminal session={session} />
            </motion.div>
          ) : (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            >
              {/* Prompt input — minimal, just a text field */}
              <div className="mb-12 flex gap-3">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Tell the factory what to build..."
                  className="flex-1 rounded-xl bg-surface-container-low px-5 py-3 text-sm text-on-surface placeholder-on-surface-muted/40 focus:bg-surface-container-lowest focus:outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && prompt.trim() && create.mutate()}
                />
                <motion.button
                  onClick={() => create.mutate()}
                  disabled={!prompt.trim() || create.isPending}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40"
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.75} />
                </motion.button>
              </div>

              <SessionList onSelect={setSelectedSession} />
            </motion.div>
          )}
        </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}
