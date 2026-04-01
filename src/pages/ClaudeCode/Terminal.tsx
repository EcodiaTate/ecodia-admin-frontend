import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSessionLogs, sendMessage, stopSession } from '@/api/claudeCode'
import { useCCSession } from '@/hooks/useCCSession'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { CCSession } from '@/types/claudeCode'

interface TerminalProps {
  session: CCSession
}

export function CCTerminal({ session }: TerminalProps) {
  const [input, setInput] = useState('')
  const outputRef = useRef<HTMLDivElement>(null)
  const { output } = useCCSession(session.id)

  const { data: logs } = useQuery({
    queryKey: ['ccLogs', session.id],
    queryFn: () => getSessionLogs(session.id, { limit: 500 }),
  })

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(session.id, content),
  })

  const stop = useMutation({
    mutationFn: () => stopSession(session.id),
  })

  const allOutput = [
    ...(logs?.logs.map((l) => l.chunk) ?? []),
    ...output,
  ]

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [allOutput.length])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={session.status} />
          {session.project_name && <span className="text-sm text-zinc-400">{session.project_name}</span>}
        </div>
        {(session.status === 'running' || session.status === 'awaiting_input') && (
          <button
            onClick={() => stop.mutate()}
            className="rounded-md bg-red-600/20 px-3 py-1.5 text-sm text-red-400 hover:bg-red-600/30"
          >
            Stop
          </button>
        )}
      </div>

      <div
        ref={outputRef}
        className="h-[500px] overflow-y-auto rounded-lg border border-zinc-800 bg-black p-4 font-mono text-sm text-green-400"
      >
        {allOutput.map((chunk, i) => (
          <pre key={i} className="whitespace-pre-wrap">{chunk}</pre>
        ))}
      </div>

      {(session.status === 'running' || session.status === 'awaiting_input') && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (input.trim()) {
              send.mutate(input)
              setInput('')
            }
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send message to session..."
            className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:border-zinc-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="rounded-md bg-zinc-800 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      )}
    </div>
  )
}
