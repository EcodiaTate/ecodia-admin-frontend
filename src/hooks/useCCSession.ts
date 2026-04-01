import { useCCSessionStore } from '@/store/ccSessionStore'
import type { CCSession } from '@/types/claudeCode'

export function useCCSession(sessionId: string) {
  const session = useCCSessionStore((s) => s.sessions.get(sessionId))
  const appendOutput = useCCSessionStore((s) => s.appendOutput)
  const updateSession = useCCSessionStore((s) => s.updateSession)

  return {
    session,
    output: session?.output || [],
    status: session?.status,
    appendOutput: (chunk: string) => appendOutput(sessionId, chunk),
    updateSession: (updates: Partial<CCSession>) => updateSession(sessionId, updates),
  }
}
