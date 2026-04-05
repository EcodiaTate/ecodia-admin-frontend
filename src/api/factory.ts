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

export async function getSessionLogs(id: string, params?: { limit?: number; offset?: number }) {
  const { data } = await api.get<{ logs: CCSessionLog[]; total: number }>(`/cc/sessions/${id}/logs`, { params })
  return data
}

export async function getSessionPipeline(id: string) {
  const { data } = await api.get(`/cc/sessions/${id}/pipeline`)
  return data
}

export async function sendSessionMessage(id: string, content: string) {
  const { data } = await api.post(`/cc/sessions/${id}/message`, { content })
  return data
}

export async function stopSession(id: string) {
  const { data } = await api.post(`/cc/sessions/${id}/stop`)
  return data
}

export async function createSession(params: {
  initialPrompt: string
  codebaseId?: string
  triggeredBy?: string
  workingDir?: string
}) {
  const { data } = await api.post<CCSession>('/cc/sessions', params)
  return data
}

export async function resumeSession(id: string, content: string) {
  const { data } = await api.post(`/cc/sessions/${id}/resume`, { content })
  return data
}

export async function getAnalytics(days?: number) {
  const { data } = await api.get('/coding/analytics', { params: { days } })
  return data
}

export async function getCodingDashboard() {
  const { data } = await api.get('/coding/dashboard')
  return data
}

export async function getCodeRequests(status?: string) {
  const { data } = await api.get('/coding/requests', { params: { status } })
  return data
}

export async function confirmCodeRequest(id: string, promptOverride?: string) {
  const { data } = await api.post(`/coding/requests/${id}/confirm`, { promptOverride })
  return data
}

export async function rejectCodeRequest(id: string, reason?: string) {
  const { data } = await api.post(`/coding/requests/${id}/reject`, { reason })
  return data
}

export async function getCodingHealth() {
  const { data } = await api.get('/coding/health')
  return data
}

export async function getClientSessions(clientId: string) {
  const { data } = await api.get(`/crm/clients/${clientId}/sessions`)
  return data
}

export async function getClientCodingSummary(clientId: string) {
  const { data } = await api.get(`/crm/clients/${clientId}/coding-summary`)
  return data
}
