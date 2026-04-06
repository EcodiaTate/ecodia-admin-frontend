import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * OS Session Store — state for the persistent CC OS session.
 * Manages the conversation stream, streaming state, and raw NDJSON chunks.
 *
 * Persistence: messages, sessionId, streamChunks, streamText, lastUserMessageAt
 * all survive tab close so we can recover mid-turn responses.
 */

export interface OSSessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Raw NDJSON chunks from CC stream-json (for distillation) */
  chunks?: string[]
  timestamp: Date
}

export interface TokenUsage {
  input: number
  output: number
  total: number
  threshold: number
  needsCompaction: boolean
}

interface OSSessionStore {
  status: 'idle' | 'streaming' | 'complete' | 'error'
  messages: OSSessionMessage[]
  /** Chunks accumulating for the current assistant response */
  streamChunks: string[]
  /** Extracted text content from current stream (for live display) */
  streamText: string
  sessionId: string | null
  /** Token usage tracking for auto-compaction */
  tokenUsage: TokenUsage | null
  /** Whether compaction is in progress */
  compacting: boolean
  /** ISO timestamp of last user message — used for recovery after tab close */
  lastUserMessageAt: string | null
  /** Whether recovery has been attempted this session */
  recoveryAttempted: boolean

  // Actions
  setStatus: (status: OSSessionStore['status']) => void
  addUserMessage: (content: string) => void
  appendStreamChunk: (chunk: string) => void
  appendStreamText: (text: string) => void
  finalizeResponse: () => void
  setSessionId: (id: string | null) => void
  setTokenUsage: (usage: TokenUsage | null) => void
  setCompacting: (v: boolean) => void
  clearMessages: () => void
  /** Inject a recovered assistant message (from backend recovery) */
  injectRecoveredResponse: (text: string, chunks?: string[]) => void
  setRecoveryAttempted: () => void
}

export const useOSSessionStore = create<OSSessionStore>()(persist((set, get) => ({
  status: 'idle',
  messages: [],
  streamChunks: [],
  streamText: '',
  sessionId: null,
  tokenUsage: null,
  compacting: false,
  lastUserMessageAt: null,
  recoveryAttempted: false,

  setStatus: (status) => set({ status }),

  addUserMessage: (content) => {
    set(state => ({
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content,
        timestamp: new Date(),
      }],
      status: 'streaming' as const,
      streamChunks: [],
      streamText: '',
      lastUserMessageAt: new Date().toISOString(),
      recoveryAttempted: false,
    }))
  },

  appendStreamChunk: (chunk) => {
    set(state => ({
      streamChunks: [...state.streamChunks, chunk],
    }))
  },

  appendStreamText: (text) => {
    set(state => ({
      streamText: state.streamText + text,
    }))
  },

  finalizeResponse: () => {
    const { streamChunks, streamText } = get()
    // Only add a message if we have content
    if (streamChunks.length === 0 && !streamText) {
      set({ status: 'complete', streamChunks: [], streamText: '', lastUserMessageAt: null })
      return
    }
    set(state => ({
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: streamText || '(processing...)',
        chunks: streamChunks,
        timestamp: new Date(),
      }],
      status: 'complete',
      streamChunks: [],
      streamText: '',
      lastUserMessageAt: null,
    }))
  },

  setSessionId: (id) => set({ sessionId: id }),
  setTokenUsage: (usage) => set({ tokenUsage: usage }),
  setCompacting: (v) => set({ compacting: v }),
  clearMessages: () => set({
    messages: [], streamChunks: [], streamText: '', status: 'idle',
    tokenUsage: null, lastUserMessageAt: null, recoveryAttempted: false,
  }),

  /** Inject a response recovered from the backend after tab close */
  injectRecoveredResponse: (text, chunks) => {
    if (!text && (!chunks || chunks.length === 0)) return
    set(state => ({
      messages: [...state.messages, {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: text || '(recovered response)',
        chunks,
        timestamp: new Date(),
      }],
      status: 'complete',
      streamChunks: [],
      streamText: '',
      lastUserMessageAt: null,
    }))
  },

  setRecoveryAttempted: () => set({ recoveryAttempted: true }),
}),
{
  name: 'os-session-chat',
  partialize: (state) => ({
    messages: state.messages,
    sessionId: state.sessionId,
    streamChunks: state.streamChunks,
    streamText: state.streamText,
    lastUserMessageAt: state.lastUserMessageAt,
  }),
},
))
