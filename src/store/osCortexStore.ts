import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OSBlock, OSChatMessage, OSWorkspace } from '@/types/os'

interface WorkspaceChat {
  messages: OSChatMessage[]
  taskId: string | null
}

interface OSCortexStore {
  mode: 'os' | 'organism'
  workspace: string
  workspaces: OSWorkspace[]
  loading: Record<string, boolean>  // per-workspace loading state
  panelOpen: boolean  // context panel visibility

  // Each workspace has its own independent chat
  chats: Record<string, WorkspaceChat>

  // Derived accessors
  getMessages: () => OSChatMessage[]
  getTaskId: () => string | null
  isLoading: () => boolean

  // Actions
  setMode: (mode: 'os' | 'organism') => void
  setWorkspace: (workspace: string) => void
  setWorkspaces: (workspaces: OSWorkspace[]) => void
  togglePanel: () => void

  // Workspace-targeted actions — always write to the specified workspace
  // This prevents async responses from landing in the wrong chat
  addUserMessageTo: (ws: string, content: string) => string
  addAssistantMessageTo: (ws: string, blocks: OSBlock[]) => void
  setTaskIdFor: (ws: string, taskId: string | null) => void
  setLoadingFor: (ws: string, loading: boolean) => void
  loadHistoryFor: (ws: string, messages: OSChatMessage[]) => void
  clearMessagesFor: (ws: string) => void

  // Convenience: operate on current workspace
  addUserMessage: (content: string) => string
  addAssistantMessage: (blocks: OSBlock[]) => void
  setTaskId: (taskId: string | null) => void
  setLoading: (loading: boolean) => void
  loadHistory: (messages: OSChatMessage[]) => void
  clearMessages: () => void
}

function generateId() {
  return crypto.randomUUID()
}

function getChatFor(state: { chats: Record<string, WorkspaceChat> }, ws: string): WorkspaceChat {
  return state.chats[ws] || { messages: [], taskId: null }
}

function updateChatFor(
  state: { chats: Record<string, WorkspaceChat> },
  ws: string,
  update: Partial<WorkspaceChat>,
): { chats: Record<string, WorkspaceChat> } {
  const current = getChatFor(state, ws)
  return {
    chats: {
      ...state.chats,
      [ws]: { ...current, ...update },
    },
  }
}

export const useOSCortexStore = create<OSCortexStore>()(persist((set, get) => ({
  mode: 'os',
  workspace: 'bookkeeping',
  workspaces: [],
  loading: {},
  panelOpen: true,
  chats: {},

  getMessages: () => getChatFor(get(), get().workspace).messages,
  getTaskId: () => getChatFor(get(), get().workspace).taskId,
  isLoading: () => get().loading[get().workspace] || false,

  setMode: (mode) => set({ mode }),
  setWorkspace: (workspace) => set({ workspace }),
  setWorkspaces: (workspaces) => set({ workspaces }),
  togglePanel: () => set(s => ({ panelOpen: !s.panelOpen })),

  // ── Targeted actions (async-safe) ──

  addUserMessageTo: (ws, content) => {
    const id = generateId()
    set(state => updateChatFor(state, ws, {
      messages: [...getChatFor(state, ws).messages, {
        id, role: 'user' as const, content, timestamp: new Date(),
      }],
    }))
    return id
  },

  addAssistantMessageTo: (ws, blocks) => {
    const textContent = blocks
      .filter(b => b.type === 'text')
      .map(b => (b as { content: string }).content)
      .join('\n')
    set(state => updateChatFor(state, ws, {
      messages: [...getChatFor(state, ws).messages, {
        id: generateId(), role: 'assistant' as const,
        content: textContent || '(actions executed)', blocks, timestamp: new Date(),
      }],
    }))
  },

  setTaskIdFor: (ws, taskId) => set(state => updateChatFor(state, ws, { taskId })),
  setLoadingFor: (ws, val) => set(state => ({ loading: { ...state.loading, [ws]: val } })),
  loadHistoryFor: (ws, messages) => set(state => updateChatFor(state, ws, { messages })),
  clearMessagesFor: (ws) => set(state => updateChatFor(state, ws, { messages: [], taskId: null })),

  // ── Convenience (current workspace) ──

  addUserMessage: (content) => get().addUserMessageTo(get().workspace, content),
  addAssistantMessage: (blocks) => get().addAssistantMessageTo(get().workspace, blocks),
  setTaskId: (taskId) => get().setTaskIdFor(get().workspace, taskId),
  setLoading: (loading) => get().setLoadingFor(get().workspace, loading),
  loadHistory: (messages) => get().loadHistoryFor(get().workspace, messages),
  clearMessages: () => get().clearMessagesFor(get().workspace),
}),
  {
    name: 'os-cortex-chats',
    partialize: (state) => ({
      workspace: state.workspace,
      chats: state.chats,
      mode: state.mode,
      panelOpen: state.panelOpen,
    }),
  },
))
