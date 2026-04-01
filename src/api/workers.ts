import api from './client'
import type { WorkerStatus } from '@/store/workerStore'

export async function getWorkerStatuses(): Promise<Record<string, WorkerStatus>> {
  const { data } = await api.get('/workers/status')
  return data
}
