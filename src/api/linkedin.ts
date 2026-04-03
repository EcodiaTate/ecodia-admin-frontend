import api from './client'
import type {
  LinkedInDM, DMStats, LinkedInPost, PostAnalytics, GeneratedPost,
  ConnectionRequest, NetworkSnapshot, AnalyticsSummary,
  ContentTheme, ScrapeLog, WorkerStatus, LeadAnalysis, SuggestedPostTimes,
} from '@/types/linkedin'

// ─── DMs ────────────────────────────────────────────────────────────────

export async function getDMs(params?: { limit?: number; offset?: number; status?: string; category?: string; priority?: string; search?: string }) {
  const { data } = await api.get<{ dms: LinkedInDM[]; total: number }>('/linkedin/dms', { params })
  return data
}

export async function getDMStats() {
  const { data } = await api.get<DMStats>('/linkedin/dms/stats')
  return data
}

export async function getDM(id: string) {
  const { data } = await api.get<LinkedInDM>(`/linkedin/dms/${id}`)
  return data
}

export async function triageDM(id: string) {
  const { data } = await api.post<LinkedInDM>(`/linkedin/dms/${id}/triage`)
  return data
}

export async function draftDMReply(id: string) {
  const { data } = await api.post<LinkedInDM>(`/linkedin/dms/${id}/draft-reply`)
  return data
}

export async function sendDM(id: string) {
  const { data } = await api.post<LinkedInDM>(`/linkedin/dms/${id}/send`)
  return data
}

export async function updateDM(id: string, fields: { status?: string; category?: string; priority?: string }) {
  const { data } = await api.patch<LinkedInDM>(`/linkedin/dms/${id}`, fields)
  return data
}

export async function analyzeDMLead(id: string) {
  const { data } = await api.post<LeadAnalysis>(`/linkedin/dms/${id}/analyze-lead`)
  return data
}

// ─── Posts ──────────────────────────────────────────────────────────────

export async function getPosts(params?: { status?: string; type?: string; theme?: string; limit?: number; offset?: number }) {
  const { data } = await api.get<LinkedInPost[]>('/linkedin/posts', { params })
  return data
}

export async function getPostsCalendar(start: string, end: string) {
  const { data } = await api.get<LinkedInPost[]>('/linkedin/posts/calendar', { params: { start, end } })
  return data
}

export async function getPostAnalytics() {
  const { data } = await api.get<PostAnalytics>('/linkedin/posts/analytics')
  return data
}

export async function suggestPostTimes() {
  const { data } = await api.get<SuggestedPostTimes>('/linkedin/posts/suggest-times')
  return data
}

export async function createPost(body: { content: string; postType?: string; hashtags?: string[]; scheduledAt?: string; theme?: string; aiGenerated?: boolean; aiPrompt?: string }) {
  const { data } = await api.post<LinkedInPost>('/linkedin/posts', body)
  return data
}

export async function deletePost(id: string) {
  const { data } = await api.delete(`/linkedin/posts/${id}`)
  return data
}

export async function generatePost(theme: string, postType?: string) {
  const { data } = await api.post<{ variations: GeneratedPost[] }>('/linkedin/posts/generate', { theme, postType })
  return data
}

// ─── Connection Requests ───────────────────────────────────────────────

export async function getConnectionRequests(params?: { status?: string; limit?: number }) {
  const { data } = await api.get<ConnectionRequest[]>('/linkedin/connections/requests', { params })
  return data
}

export async function acceptConnection(id: string) {
  const { data } = await api.post(`/linkedin/connections/requests/${id}/accept`)
  return data
}

export async function declineConnection(id: string) {
  const { data } = await api.post(`/linkedin/connections/requests/${id}/decline`)
  return data
}

export async function batchConnectionAction(ids: string[], action: 'accept' | 'decline') {
  const { data } = await api.post('/linkedin/connections/requests/batch', { ids, action })
  return data
}

// ─── Analytics ─────────────────────────────────────────────────────────

export async function getNetworkSnapshots(days?: number) {
  const { data } = await api.get<NetworkSnapshot[]>('/linkedin/analytics/network', { params: { days } })
  return data
}

export async function getAnalyticsSummary() {
  const { data } = await api.get<AnalyticsSummary>('/linkedin/analytics/summary')
  return data
}

// ─── Content Themes ────────────────────────────────────────────────────

export async function getContentThemes() {
  const { data } = await api.get<ContentTheme[]>('/linkedin/content-themes')
  return data
}

export async function createContentTheme(body: { name: string; description?: string; dayOfWeek?: number; timeOfDay?: string; promptTemplate?: string }) {
  const { data } = await api.post<ContentTheme>('/linkedin/content-themes', body)
  return data
}

export async function deleteContentTheme(id: string) {
  const { data } = await api.delete(`/linkedin/content-themes/${id}`)
  return data
}

// ─── Worker / Session ──────────────────────────────────────────────────

export async function getWorkerStatus() {
  const { data } = await api.get<WorkerStatus>('/linkedin/worker/status')
  return data
}

export async function resumeWorker() {
  const { data } = await api.post('/linkedin/worker/resume')
  return data
}

export async function triggerJob(jobType: string) {
  const { data } = await api.post(`/linkedin/worker/trigger/${jobType}`)
  return data
}

export async function getWorkerLogs(limit?: number) {
  const { data } = await api.get<ScrapeLog[]>('/linkedin/worker/logs', { params: { limit } })
  return data
}

export async function setSessionCookie(cookie: string) {
  const { data } = await api.post('/linkedin/session/cookie', { cookie })
  return data
}

