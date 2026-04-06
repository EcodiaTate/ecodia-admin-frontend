import api from './client'

/**
 * OS Session API — communicates with the persistent CC OS session.
 * Response data streams via WebSocket, these calls just initiate/query.
 */

export async function sendOSMessage(message: string) {
  const { data } = await api.post('/os-session/message', { message }, { timeout: 300_000 })
  return data as { sessionId: string; ccCliSessionId: string | null; code: number; text: string }
}

export async function getOSStatus() {
  const { data } = await api.get('/os-session/status')
  return data as {
    active: boolean
    sessionId: string | null
    ccCliSessionId: string | null
    status: 'idle' | 'streaming' | 'complete' | 'error'
    startedAt: string | null
  }
}

export async function restartOS() {
  const { data } = await api.post('/os-session/restart')
  return data as { sessionId: string }
}

export async function getOSHistory(limit = 100) {
  const { data } = await api.get('/os-session/history', { params: { limit } })
  return data.history as { content: string; created_at: string }[]
}

export async function compactOS(summary: string) {
  const { data } = await api.post('/os-session/compact', { summary }, { timeout: 300_000 })
  return data as { sessionId: string }
}

export async function getTokenUsage() {
  const { data } = await api.get('/os-session/tokens')
  return data as { input: number; output: number; total: number; threshold: number; needsCompaction: boolean }
}

/** Recover missed assistant response after tab close / disconnect */
export async function recoverResponse(since?: string) {
  const { data } = await api.get('/os-session/recover', { params: since ? { since } : {} })
  return data as {
    found: boolean
    text: string
    chunks: string[]
    status: string
    streaming: boolean
    sessionId?: string
  }
}
