import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * OS Session Store — state for the persistent CC OS session.
 * Manages the conversation stream, streaming state, and raw NDJSON chunks.
 */

export interface OSSessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Raw NDJSON chunks from CC stream-json (for distillation) */
  chunks?: string[]
  timestamp: Date
}

interface OSSessionStore {
  status: 'idle' | 'streaming' | 'complete' | 'error'
  messages: OSSessionMessage[]
  /** Chunks accumulating for the current assistant response */
  streamChunks: string[]
  /** Extracted text content from current stream (for live display) */
  streamText: string
  sessionId: string | null

  // Actions
  setStatus: (status: OSSessionStore['status']) => void
  addUserMessage: (content: string) => void
  appendStreamChunk: (chunk: string) => void
  appendStreamText: (text: string) => void
  finalizeResponse: () => void
  setSessionId: (id: string | null) => void
  clearMessages: () => void
}

export const useOSSessionStore = create<OSSessionStore>()(persist((set, get) => ({
  status: 'idle',
  messages: [],
  streamChunks: [],
  streamText: '',
  sessionId: null,

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
      set({ status: 'complete', streamChunks: [], streamText: '' })
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
    }))
  },

  setSessionId: (id) => set({ sessionId: id }),
  clearMessages: () => set({ messages: [], streamChunks: [], streamText: '', status: 'idle' }),
}),
{
  name: 'os-session-chat',
  partialize: (state) => ({
    messages: state.messages,
    sessionId: state.sessionId,
  }),
},
))
