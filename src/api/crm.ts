import api from './client'
import type { Client, Project, Pipeline } from '@/types/crm'

export async function getClients(params?: { limit?: number; offset?: number }) {
  const { data } = await api.get<{ clients: Client[]; total: number }>('/crm/clients', { params })
  return data
}

export async function getClient(id: string) {
  const { data } = await api.get<Client>(`/crm/clients/${id}`)
  return data
}

export async function getPipeline() {
  const { data } = await api.get<Pipeline>('/crm/pipeline')
  return data
}

export async function getClientProjects(clientId: string) {
  const { data } = await api.get<Project[]>(`/crm/clients/${clientId}/projects`)
  return data
}

export async function getClientIntelligence(clientId: string) {
  const { data } = await api.get(`/crm/clients/${clientId}/intelligence`)
  return data
}

export async function getClientTimeline(clientId: string, params?: { limit?: number; types?: string }) {
  const { data } = await api.get(`/crm/clients/${clientId}/timeline`, { params })
  return data
}

export async function getClientContacts(clientId: string) {
  const { data } = await api.get(`/crm/clients/${clientId}/contacts`)
  return data
}

export async function addClientContact(clientId: string, contact: { name: string; role?: string; email?: string; phone?: string; isPrimary?: boolean }) {
  const { data } = await api.post(`/crm/clients/${clientId}/contacts`, contact)
  return data
}

export async function getClientTasks(clientId: string, includeCompleted = false) {
  const { data } = await api.get(`/crm/clients/${clientId}/tasks`, { params: { includeCompleted } })
  return data
}

export async function completeTask(taskId: string) {
  const { data } = await api.post(`/crm/tasks/${taskId}/complete`)
  return data
}

export async function searchClients(q: string) {
  const { data } = await api.get('/crm/search', { params: { q } })
  return data
}

export async function getCRMDashboard() {
  const { data } = await api.get('/crm/dashboard')
  return data
}

export async function getCRMAnalytics() {
  const { data } = await api.get('/crm/analytics')
  return data
}

export async function getRevenue(clientId?: string) {
  const { data } = await api.get('/crm/revenue', { params: { clientId } })
  return data
}

export async function updateClientStatus(clientId: string, status: string, note?: string) {
  const { data } = await api.patch(`/crm/clients/${clientId}/status`, { status, note })
  return data
}

