import { create } from 'zustand'
import type { CCSession } from '@/types/claudeCode'

interface CCSessionStore {
  sessions: Map<string, CCSession & { output: string[] }>
  updateSession: (sessionId: string, updates: Partial<CCSession>) => void
  appendOutput: (sessionId: string, chunk: string) => void
  setSession: (session: CCSession) => void
  removeSession: (sessionId: string) => void
}

export const useCCSessionStore = create<CCSessionStore>((set) => ({
  sessions: new Map(),
  setSession: (session) =>
    set((s) => {
      const sessions = new Map(s.sessions)
      sessions.set(session.id, { ...session, output: sessions.get(session.id)?.output || [] })
      return { sessions }
    }),
  updateSession: (sessionId, updates) =>
    set((s) => {
      const sessions = new Map(s.sessions)
      const existing = sessions.get(sessionId)
      if (existing) sessions.set(sessionId, { ...existing, ...updates })
      return { sessions }
    }),
  appendOutput: (sessionId, chunk) =>
    set((s) => {
      const sessions = new Map(s.sessions)
      const existing = sessions.get(sessionId)
      if (existing) sessions.set(sessionId, { ...existing, output: [...existing.output, chunk] })
      return { sessions }
    }),
  removeSession: (sessionId) =>
    set((s) => {
      const sessions = new Map(s.sessions)
      sessions.delete(sessionId)
      return { sessions }
    }),
}))
