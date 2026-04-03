import { create } from 'zustand'
import type { ChatMessage, CortexBlock, AttachedFile, AmbientEvent } from '@/types/cortex'
import type { CCSession } from '@/types/claudeCode'

// ─── Inline CC session state ──────────────────────────────────────────────────

export interface InlineCCSession extends CCSession {
  output: string[]
}

interface CortexStore {
  messages: ChatMessage[]
  ambientEvents: AmbientEvent[]
  activeNodes: string[]
  isThinking: boolean
  sessionId: string
  briefingLoaded: boolean

  inlineSessions: Map<string, InlineCCSession>

  addUserMessage: (content: string, attachments?: AttachedFile[]) => string
  addAssistantMessage: (blocks: CortexBlock[], mentionedNodes?: string[]) => void
  setThinking: (thinking: boolean) => void
  setActiveNodes: (nodes: string[]) => void
  setBriefingLoaded: (loaded: boolean) => void
  clearChat: () => void

  // Ambient event system — the Cortex sees everything
  pushAmbientEvent: (event: Omit<AmbientEvent, 'id' | 'timestamp'>) => AmbientEvent
  clearAmbientEvents: () => void

  // CC session management
  registerCCSession: (session: CCSession) => void
  appendCCOutput: (sessionId: string, chunk: string) => void
  updateCCSession: (sessionId: string, updates: Partial<CCSession>) => void
}

function generateId() {
  return crypto.randomUUID()
}

export const useCortexStore = create<CortexStore>((set, _get) => ({
  messages: [],
  ambientEvents: [],
  activeNodes: [],
  isThinking: false,
  sessionId: generateId(),
  briefingLoaded: false,
  inlineSessions: new Map(),

  addUserMessage: (content: string, attachments?: AttachedFile[]) => {
    const id = generateId()
    set(state => ({
      messages: [...state.messages, {
        id,
        role: 'user',
        content,
        attachments,
        timestamp: new Date(),
      }],
    }))
    return id
  },

  addAssistantMessage: (blocks: CortexBlock[], mentionedNodes?: string[]) => {
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
        id: generateId(),
        role: 'assistant',
        content: textContent,
        blocks,
        mentionedNodes,
        timestamp: new Date(),
      }],
      activeNodes: mentionedNodes || state.activeNodes,
    }))
  },

  setThinking: (thinking: boolean) => set({ isThinking: thinking }),
  setActiveNodes: (nodes: string[]) => set({ activeNodes: nodes }),
  setBriefingLoaded: (loaded: boolean) => set({ briefingLoaded: loaded }),

  clearChat: () => set({
    messages: [],
    ambientEvents: [],
    activeNodes: [],
    isThinking: false,
    sessionId: generateId(),
    briefingLoaded: false,
    inlineSessions: new Map(),
  }),

  pushAmbientEvent: (event) => {
    const full: AmbientEvent = { ...event, id: generateId(), timestamp: new Date() }
    set(state => ({ ambientEvents: [...state.ambientEvents, full] }))
    return full
  },

  clearAmbientEvents: () => set({ ambientEvents: [] }),

  registerCCSession: (session: CCSession) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      m.set(session.id, { ...session, output: m.get(session.id)?.output ?? [] })
      return { inlineSessions: m }
    }),

  appendCCOutput: (sessionId: string, chunk: string) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      const existing = m.get(sessionId)
      if (existing) m.set(sessionId, { ...existing, output: [...existing.output, chunk] })
      return { inlineSessions: m }
    }),

  updateCCSession: (sessionId: string, updates: Partial<CCSession>) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      const existing = m.get(sessionId)
      if (existing) m.set(sessionId, { ...existing, ...updates })
      return { inlineSessions: m }
    }),
}))
