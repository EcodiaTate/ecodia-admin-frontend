import { create } from 'zustand'
import type { ChatMessage, CortexBlock, AttachedFile } from '@/types/cortex'

interface CortexStore {
  messages: ChatMessage[]
  activeNodes: string[]
  isThinking: boolean
  sessionId: string
  briefingLoaded: boolean

  addUserMessage: (content: string, attachments?: AttachedFile[]) => string
  addAssistantMessage: (blocks: CortexBlock[], mentionedNodes?: string[]) => void
  setThinking: (thinking: boolean) => void
  setActiveNodes: (nodes: string[]) => void
  setBriefingLoaded: (loaded: boolean) => void
  clearChat: () => void
}

function generateId() {
  return crypto.randomUUID()
}

export const useCortexStore = create<CortexStore>((set, _get) => ({
  messages: [],
  activeNodes: [],
  isThinking: false,
  sessionId: generateId(),
  briefingLoaded: false,

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
    activeNodes: [],
    isThinking: false,
    sessionId: generateId(),
    briefingLoaded: false,
  }),
}))
