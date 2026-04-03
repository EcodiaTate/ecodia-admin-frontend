import { create } from 'zustand'
import type { ChatMessage, CortexBlock, AttachedFile, AmbientEvent } from '@/types/cortex'
import type { CCSession } from '@/types/claudeCode'

export interface InlineCCSession extends CCSession {
  output: string[]
}

interface CortexStore {
  messages: ChatMessage[]
  ambientEvents: AmbientEvent[]
  activeNodes: string[]
  /** Number of inflight requests. Input is NEVER blocked — this is a display hint only. */
  inflightCount: number
  sessionId: string
  briefingLoaded: boolean
  inlineSessions: Map<string, InlineCCSession>

  addUserMessage: (content: string, attachments?: AttachedFile[]) => string
  addAssistantMessage: (blocks: CortexBlock[], mentionedNodes?: string[]) => void
  /** Increment/decrement inflight counter. Never gates input. */
  startInflight: () => void
  endInflight: () => void
  setBriefingLoaded: (loaded: boolean) => void
  pushAmbientEvent: (event: Omit<AmbientEvent, 'id' | 'timestamp'>) => AmbientEvent
  registerCCSession: (session: CCSession) => void
  appendCCOutput: (sessionId: string, chunk: string) => void
  updateCCSession: (sessionId: string, updates: Partial<CCSession>) => void
}

function generateId() {
  return crypto.randomUUID()
}

export const useCortexStore = create<CortexStore>((set) => ({
  messages: [],
  ambientEvents: [],
  activeNodes: [],
  inflightCount: 0,
  sessionId: generateId(),
  briefingLoaded: false,
  inlineSessions: new Map(),

  addUserMessage: (content, attachments) => {
    const id = generateId()
    set(state => ({
      messages: [...state.messages, { id, role: 'user', content, attachments, timestamp: new Date() }],
    }))
    return id
  },

  addAssistantMessage: (blocks, mentionedNodes) => {
    const textContent = blocks
      .filter(b => b.type === 'text')
      .map(b => (b as { content: string }).content)
      .join('\n')
      || blocks.map(b => {
        if ('title' in b) return (b as { title: string }).title
        if ('message' in b) return (b as { message: string }).message
        return ''
      }).filter(Boolean).join('; ')
      || '[response]'

    set(state => ({
      messages: [...state.messages, {
        id: generateId(), role: 'assistant', content: textContent, blocks, mentionedNodes, timestamp: new Date(),
      }],
      activeNodes: mentionedNodes || state.activeNodes,
    }))
  },

  startInflight: () => set(s => ({ inflightCount: s.inflightCount + 1 })),
  endInflight: () => set(s => ({ inflightCount: Math.max(0, s.inflightCount - 1) })),
  setBriefingLoaded: (loaded) => set({ briefingLoaded: loaded }),

  pushAmbientEvent: (event) => {
    const full: AmbientEvent = { ...event, id: generateId(), timestamp: new Date() }
    set(state => ({ ambientEvents: [...state.ambientEvents, full] }))
    return full
  },

  registerCCSession: (session) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      m.set(session.id, { ...session, output: m.get(session.id)?.output ?? [] })
      return { inlineSessions: m }
    }),
  appendCCOutput: (sessionId, chunk) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      const existing = m.get(sessionId)
      if (existing) m.set(sessionId, { ...existing, output: [...existing.output, chunk] })
      return { inlineSessions: m }
    }),
  updateCCSession: (sessionId, updates) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      const existing = m.get(sessionId)
      if (existing) m.set(sessionId, { ...existing, ...updates })
      return { inlineSessions: m }
    }),
}))
