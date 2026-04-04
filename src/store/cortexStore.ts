import { create } from 'zustand'
import type { ChatMessage, CortexBlock, AttachedFile, AmbientEvent } from '@/types/cortex'
import type { CCSession } from '@/types/claudeCode'

export interface InlineCCSession extends CCSession {
  output: string[]
}

const MAX_MESSAGES = 5000              // 10x — full conversation history for deep self-knowledge
const MAX_AMBIENT_EVENTS = 3000        // 10x — retain system event history for pattern recognition
const MAX_SESSION_OUTPUT_CHUNKS = 20000 // 10x — full CC session output for complete observability

interface CortexStore {
  messages: ChatMessage[]
  ambientEvents: AmbientEvent[]
  activeNodes: string[]
  /** Number of inflight requests. Input is NEVER blocked — this is a display hint only. */
  inflightCount: number
  inlineSessions: Map<string, InlineCCSession>
  /** True once the initial briefing has been loaded this session. Persists across page navigations. */
  briefingLoaded: boolean
  /** Action card keys (action:title) that have been approved or dismissed this session. Survives page navigation. */
  actionedCards: Set<string>

  addUserMessage: (content: string, attachments?: AttachedFile[]) => string
  addAssistantMessage: (blocks: CortexBlock[], mentionedNodes?: string[]) => void
  /** Increment/decrement inflight counter. Never gates input. */
  startInflight: () => void
  endInflight: () => void
  pushAmbientEvent: (event: Omit<AmbientEvent, 'id' | 'timestamp'>) => AmbientEvent
  registerCCSession: (session: CCSession) => void
  appendCCOutput: (sessionId: string, chunk: string) => void
  updateCCSession: (sessionId: string, updates: Partial<CCSession>) => void
  markBriefingLoaded: () => void
  /** Mark an action card as actioned (approved or dismissed). Key format: "action:title" */
  markCardActioned: (action: string, title: string) => void
  /** Check if an action card has already been actioned. */
  isCardActioned: (action: string, title: string) => boolean
}

function generateId() {
  return crypto.randomUUID()
}

export const useCortexStore = create<CortexStore>((set, get) => ({
  messages: [],
  ambientEvents: [],
  activeNodes: [],
  inflightCount: 0,
  inlineSessions: new Map(),
  briefingLoaded: false,
  actionedCards: new Set<string>(),

  addUserMessage: (content, attachments) => {
    const id = generateId()
    set(state => ({
      messages: [...state.messages, { id, role: 'user' as const, content, attachments, timestamp: new Date() }].slice(-MAX_MESSAGES),
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
        id: generateId(), role: 'assistant' as const, content: textContent, blocks, mentionedNodes, timestamp: new Date(),
      }].slice(-MAX_MESSAGES),
      activeNodes: mentionedNodes || state.activeNodes,
    }))
  },

  startInflight: () => set(s => ({ inflightCount: s.inflightCount + 1 })),
  endInflight: () => set(s => ({ inflightCount: Math.max(0, s.inflightCount - 1) })),

  pushAmbientEvent: (event) => {
    const full: AmbientEvent = { ...event, id: generateId(), timestamp: new Date() }
    set(state => ({ ambientEvents: [...state.ambientEvents, full].slice(-MAX_AMBIENT_EVENTS) }))
    return full
  },

  markBriefingLoaded: () => set({ briefingLoaded: true }),

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
      if (existing) m.set(sessionId, { ...existing, output: [...existing.output, chunk].slice(-MAX_SESSION_OUTPUT_CHUNKS) })
      return { inlineSessions: m }
    }),
  updateCCSession: (sessionId, updates) =>
    set(state => {
      const m = new Map(state.inlineSessions)
      const existing = m.get(sessionId)
      if (existing) m.set(sessionId, { ...existing, ...updates })
      return { inlineSessions: m }
    }),

  markCardActioned: (action, title) =>
    set(state => {
      const next = new Set(state.actionedCards)
      next.add(`${action}:${title}`)
      return { actionedCards: next }
    }),

  isCardActioned: (action, title) => get().actionedCards.has(`${action}:${title}`),
}))
