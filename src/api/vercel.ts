import api from './client'
import type { VercelProject, VercelDeployment, VercelStats } from '@/types/workspace'

export async function getVercelStats() {
  const { data } = await api.get<VercelStats>('/vercel/stats')
  return data
}

export async function getVercelProjects() {
  const { data } = await api.get<VercelProject[]>('/vercel/projects')
  return data
}

export async function getVercelDeployments(params?: { projectId?: string; state?: string; limit?: number }) {
  const { data } = await api.get<VercelDeployment[]>('/vercel/deployments', { params })
  return data
}

export async function syncVercel() {
  const { data } = await api.post('/vercel/sync')
  return data
}
