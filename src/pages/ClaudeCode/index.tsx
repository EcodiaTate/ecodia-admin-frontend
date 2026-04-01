import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSession, createSession } from '@/api/claudeCode'
import { SessionList } from './SessionList'
import { CCTerminal } from './Terminal'
import type { CCSession } from '@/types/claudeCode'
import toast from 'react-hot-toast'

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
      <div className="space-y-6">
        <button onClick={() => setSelectedSession(null)} className="text-sm text-zinc-400 hover:text-zinc-200">
          &larr; Back to sessions
        </button>
        <CCTerminal session={session} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Claude Code</h1>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5">
        <h2 className="mb-3 text-sm font-medium text-zinc-400">New Session</h2>
        <div className="flex gap-2">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter initial prompt for CC..."
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          <button
            onClick={() => create.mutate()}
            disabled={!prompt.trim() || create.isPending}
            className="rounded-md bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 disabled:opacity-50"
          >
            Start
          </button>
        </div>
      </div>

      <SessionList onSelect={setSelectedSession} />
    </div>
  )
}
