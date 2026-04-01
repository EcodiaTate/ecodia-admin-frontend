import api from './client'

export async function getDMs(params?: { limit?: number; offset?: number; status?: string }) {
  const { data } = await api.get('/linkedin/dms', { params })
  return data
}

export async function getDM(id: string) {
  const { data } = await api.get(`/linkedin/dms/${id}`)
  return data
}

export async function draftDMReply(id: string) {
  const { data } = await api.post(`/linkedin/dms/${id}/draft-reply`)
  return data
}

export async function sendDM(id: string) {
  const { data } = await api.post(`/linkedin/dms/${id}/send`)
  return data
}

export async function getScheduledPosts() {
  const { data } = await api.get('/linkedin/posts/scheduled')
  return data
}

export async function schedulePost(content: string, scheduledAt?: string) {
  const { data } = await api.post('/linkedin/posts/schedule', { content, scheduledAt })
  return data
}

export async function getWorkerStatus() {
  const { data } = await api.get('/linkedin/worker/status')
  return data
}

export async function resumeWorker() {
  const { data } = await api.post('/linkedin/worker/resume')
  return data
}
