import { create } from 'zustand'
import type { OSBlock, OSChatMessage, OSWorkspace, OSTaskSummary } from '@/types/os'

interface OSCortexStore {
  // State
  mode: 'os' | 'organism'
  workspace: string
  taskId: string | null
  messages: OSChatMessage[]
  workspaces: OSWorkspace[]
  recentTasks: OSTaskSummary[]
  loading: boolean

  // Per-workspace message stash (survives workspace switches and navigation)
  _stash: Record<string, { messages: OSChatMessage[]; taskId: string | null }>

  // Actions
  setMode: (mode: 'os' | 'organism') => void
  setWorkspace: (workspace: string) => void
  setTaskId: (taskId: string | null) => void
  setWorkspaces: (workspaces: OSWorkspace[]) => void
  setRecentTasks: (tasks: OSTaskSummary[]) => void
  setLoading: (loading: boolean) => void
  addUserMessage: (content: string) => string
  addAssistantMessage: (blocks: OSBlock[]) => void
  loadHistory: (messages: OSChatMessage[]) => void
  clearMessages: () => void
}

function generateId() {
  return crypto.randomUUID()
}

export const useOSCortexStore = create<OSCortexStore>((set, get) => ({
  mode: 'os',
  workspace: 'bookkeeping',
  taskId: null,
  messages: [],
  workspaces: [],
  recentTasks: [],
  loading: false,
  _stash: {},

  setMode: (mode) => set({ mode }),

  setWorkspace: (workspace) => {
    const state = get()
    // Stash current workspace's messages
    const newStash = {
      ...state._stash,
      [state.workspace]: { messages: state.messages, taskId: state.taskId },
    }
    // Restore target workspace's messages (or start fresh)
    const restored = newStash[workspace]
    set({
      workspace,
      _stash: newStash,
      messages: restored?.messages || [],
      taskId: restored?.taskId || null,
    })
  },

  setTaskId: (taskId) => set({ taskId }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  setRecentTasks: (tasks) => set({ recentTasks: tasks }),
  setLoading: (loading) => set({ loading }),

  addUserMessage: (content) => {
    const id = generateId()
    set(state => ({
      messages: [...state.messages, {
        id,
        role: 'user' as const,
        content,
        timestamp: new Date(),
      }],
    }))
    return id
  },

  addAssistantMessage: (blocks) => {
    const textContent = blocks
      .filter(b => b.type === 'text')
      .map(b => (b as { content: string }).content)
      .join('\n')

    set(state => ({
      messages: [...state.messages, {
        id: generateId(),
        role: 'assistant' as const,
        content: textContent || '(actions executed)',
        blocks,
        timestamp: new Date(),
      }],
    }))
  },

  loadHistory: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [], taskId: null }),
}))
