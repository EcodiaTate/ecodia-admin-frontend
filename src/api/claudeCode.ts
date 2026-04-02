import api from './client'
import type { CCSession, CCSessionLog } from '@/types/claudeCode'

export async function getSessions(params?: { limit?: number; offset?: number; status?: string }) {
  const { data } = await api.get<{ sessions: CCSession[]; total: number }>('/cc/sessions', { params })
  return data
}

export async function getSession(id: string) {
  const { data } = await api.get<CCSession>(`/cc/sessions/${id}`)
  return data
}

export async function createSession(session: { initialPrompt: string; projectId?: string; clientId?: string; workingDir?: string }) {
  const { data } = await api.post<CCSession>('/cc/sessions', session)
  return data
}

export async function getSessionLogs(id: string, params?: { limit?: number; offset?: number }) {
  const { data } = await api.get<{ logs: CCSessionLog[]; total: number }>(`/cc/sessions/${id}/logs`, { params })
  return data
}

export async function sendMessage(id: string, content: string) {
  const { data } = await api.post(`/cc/sessions/${id}/message`, { content })
  return data
}

export async function stopSession(id: string) {
  const { data } = await api.post(`/cc/sessions/${id}/stop`)
  return data
}

export interface CCPipelineStatus {
  pipeline_stage: 'queued' | 'context' | 'executing' | 'testing' | 'review' | 'deploying' | 'complete' | 'failed'
  confidence_score: number | null
  deploy_status: 'pending' | 'deploying' | 'deployed' | 'reverted' | 'skipped' | null
  files_changed: number
  commit_sha: string | null
  active: boolean
}

export async function getSessionPipeline(id: string) {
  const { data } = await api.get<CCPipelineStatus>(`/cc/sessions/${id}/pipeline`)
  return data
}
