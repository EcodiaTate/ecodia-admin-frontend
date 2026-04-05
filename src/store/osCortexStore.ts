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

export const useOSCortexStore = create<OSCortexStore>((set) => ({
  mode: 'os',
  workspace: 'bookkeeping',  // default to bookkeeping since that's the priority
  taskId: null,
  messages: [],
  workspaces: [],
  recentTasks: [],
  loading: false,

  setMode: (mode) => set({ mode }),
  setWorkspace: (workspace) => set({ workspace, taskId: null, messages: [] }),
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
