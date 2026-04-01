import api from './client'
import type { EmailThread } from '@/types/gmail'

export async function getThreads(params?: { limit?: number; offset?: number; status?: string; priority?: string; inbox?: string }) {
  const { data } = await api.get<{ threads: EmailThread[]; total: number }>('/gmail/threads', { params })
  return data
}

export async function getThread(id: string) {
  const { data } = await api.get<EmailThread>(`/gmail/threads/${id}`)
  return data
}

export async function draftReply(id: string) {
  const { data } = await api.post<EmailThread>(`/gmail/threads/${id}/draft-reply`)
  return data
}

export async function sendDraft(id: string) {
  const { data } = await api.post<EmailThread>(`/gmail/threads/${id}/send-draft`)
  return data
}

export async function archiveThread(id: string) {
  const { data } = await api.post(`/gmail/threads/${id}/archive`)
  return data
}

export async function markRead(id: string) {
  const { data } = await api.post(`/gmail/threads/${id}/read`)
  return data
}

export async function trashThread(id: string) {
  const { data } = await api.post(`/gmail/threads/${id}/trash`)
  return data
}

export async function triageThread(id: string) {
  const { data } = await api.post<EmailThread>(`/gmail/threads/${id}/triage`)
  return data
}

export async function syncGmail() {
  const { data } = await api.post('/gmail/sync')
  return data
}

export async function getGmailStats() {
  const { data } = await api.get('/gmail/stats')
  return data as { unread: number; urgent: number; high: number; pending_triage: number; failed_triage: number }
}
