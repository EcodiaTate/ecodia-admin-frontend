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

