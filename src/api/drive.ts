import api from './client'
import type { DriveFile, DriveStats } from '@/types/workspace'

export async function getDriveStats() {
  const { data } = await api.get<DriveStats>('/drive/stats')
  return data
}

export async function searchDrive(query: string, limit = 20) {
  const { data } = await api.post<DriveFile[]>('/drive/search', { query, limit })
  return data
}
