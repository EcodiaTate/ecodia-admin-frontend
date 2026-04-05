import { create } from 'zustand'
import type { OSBlock, OSChatMessage, OSWorkspace } from '@/types/os'

interface WorkspaceChat {
  messages: OSChatMessage[]
  taskId: string | null
}

interface OSCortexStore {
  mode: 'os' | 'organism'
  workspace: string
  workspaces: OSWorkspace[]
  loading: boolean

  // Each workspace has its own independent chat — fully isolated
  chats: Record<string, WorkspaceChat>

  // Derived accessors (read from current workspace's chat)
  getMessages: () => OSChatMessage[]
  getTaskId: () => string | null

  // Actions
  setMode: (mode: 'os' | 'organism') => void
  setWorkspace: (workspace: string) => void
  setTaskId: (taskId: string | null) => void
  setWorkspaces: (workspaces: OSWorkspace[]) => void
  setLoading: (loading: boolean) => void
  addUserMessage: (content: string) => string
  addAssistantMessage: (blocks: OSBlock[]) => void
  loadHistory: (messages: OSChatMessage[]) => void
  clearMessages: () => void
}

function generateId() {
  return crypto.randomUUID()
}

function getChat(state: { chats: Record<string, WorkspaceChat>; workspace: string }): WorkspaceChat {
  return state.chats[state.workspace] || { messages: [], taskId: null }
}

function updateChat(
  state: { chats: Record<string, WorkspaceChat>; workspace: string },
  update: Partial<WorkspaceChat>,
): { chats: Record<string, WorkspaceChat> } {
  const current = getChat(state)
  return {
    chats: {
      ...state.chats,
      [state.workspace]: { ...current, ...update },
    },
  }
}

export const useOSCortexStore = create<OSCortexStore>((set, get) => ({
  mode: 'os',
  workspace: 'bookkeeping',
  workspaces: [],
  loading: false,
  chats: {},

  getMessages: () => getChat(get()).messages,
  getTaskId: () => getChat(get()).taskId,

  setMode: (mode) => set({ mode }),
  setWorkspace: (workspace) => set({ workspace }),
  setTaskId: (taskId) => set(state => updateChat(state, { taskId })),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setLoading: (loading) => set({ loading }),

  addUserMessage: (content) => {
    const id = generateId()
    set(state => {
      const chat = getChat(state)
      return updateChat(state, {
        messages: [...chat.messages, {
          id,
          role: 'user' as const,
          content,
          timestamp: new Date(),
        }],
      })
    })
    return id
  },

  addAssistantMessage: (blocks) => {
    const textContent = blocks
      .filter(b => b.type === 'text')
      .map(b => (b as { content: string }).content)
      .join('\n')

    set(state => {
      const chat = getChat(state)
      return updateChat(state, {
        messages: [...chat.messages, {
          id: generateId(),
          role: 'assistant' as const,
          content: textContent || '(actions executed)',
          blocks,
          timestamp: new Date(),
        }],
      })
    })
  },

  loadHistory: (messages) => set(state => updateChat(state, { messages })),
  clearMessages: () => set(state => updateChat(state, { messages: [], taskId: null })),
}))
