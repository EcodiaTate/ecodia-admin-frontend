import api from './client'
import type { EmailThread } from '@/types/gmail'

export async function getThreads(params?: { limit?: number; offset?: number; status?: string; priority?: string }) {
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

export async function syncGmail() {
  const { data } = await api.post('/gmail/sync')
  return data
}
