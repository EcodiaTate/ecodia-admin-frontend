import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getSessionLogs, sendMessage, stopSession } from '@/api/claudeCode'
import { useCCSession } from '@/hooks/useCCSession'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { CCSession } from '@/types/claudeCode'
import { Send, Square } from 'lucide-react'

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusBadge status={session.status} />
          {session.project_name && (
            <span className="text-sm text-on-surface-muted">{session.project_name}</span>
          )}
        </div>
        {(session.status === 'running' || session.status === 'awaiting_input') && (
          <button
            onClick={() => stop.mutate()}
            className="flex items-center gap-2 rounded-xl bg-error/10 px-4 py-2.5 text-sm text-error transition-colors hover:bg-error/20"
          >
            <Square className="h-3.5 w-3.5" strokeWidth={1.75} />
            Stop
          </button>
        )}
      </div>

      {/* Terminal output with glass frame */}
      <div className="glass rounded-3xl overflow-hidden">
        <div
          ref={outputRef}
          className="h-[500px] overflow-y-auto bg-[#0F1419]/90 p-6 font-mono text-sm leading-relaxed text-primary-container"
        >
          {allOutput.map((chunk, i) => (
            <pre key={i} className="whitespace-pre-wrap">{chunk}</pre>
          ))}
          {allOutput.length === 0 && (
            <span className="text-on-surface-muted/40">Awaiting output...</span>
          )}
        </div>
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
          className="flex gap-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send message to session..."
            className="flex-1 rounded-xl bg-surface-container-low px-5 py-3 font-mono text-sm text-on-surface placeholder-on-surface-muted transition-colors focus:bg-surface-container-lowest focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || send.isPending}
            className="btn-primary-gradient flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
            Send
          </button>
        </form>
      )}
    </div>
  )
}
