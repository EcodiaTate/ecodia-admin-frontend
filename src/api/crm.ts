import api from './client'
import type { Client, Project, Task, Pipeline } from '@/types/crm'

export async function getClients(params?: { limit?: number; offset?: number }) {
  const { data } = await api.get<{ clients: Client[]; total: number }>('/crm/clients', { params })
  return data
}

export async function getClient(id: string) {
  const { data } = await api.get<Client>(`/crm/clients/${id}`)
  return data
}

export async function createClient(client: Partial<Client>) {
  const { data } = await api.post<Client>('/crm/clients', client)
  return data
}

export async function updateClient(id: string, updates: Partial<Client>) {
  const { data } = await api.patch<Client>(`/crm/clients/${id}`, updates)
  return data
}

export async function deleteClient(id: string) {
  const { data } = await api.delete(`/crm/clients/${id}`)
  return data
}

export async function getPipeline() {
  const { data } = await api.get<Pipeline>('/crm/pipeline')
  return data
}

export async function updateStage(id: string, stage: string, note?: string) {
  const { data } = await api.patch(`/crm/clients/${id}/stage`, { stage, note })
  return data
}

export async function addNote(id: string, content: string) {
  const { data } = await api.post(`/crm/clients/${id}/notes`, { content })
  return data
}

export async function getClientProjects(clientId: string) {
  const { data } = await api.get<Project[]>(`/crm/clients/${clientId}/projects`)
  return data
}

export async function createProject(project: Partial<Project> & { clientId: string }) {
  const { data } = await api.post<Project>('/crm/projects', project)
  return data
}

export async function getTasks(params?: { limit?: number; offset?: number; status?: string; clientId?: string }) {
  const { data } = await api.get<{ tasks: Task[]; total: number }>('/tasks', { params })
  return data
}

export async function createTask(task: Partial<Task>) {
  const { data } = await api.post<Task>('/tasks', task)
  return data
}

export async function updateTask(id: string, updates: Partial<Task>) {
  const { data } = await api.patch<Task>(`/tasks/${id}`, updates)
  return data
}
