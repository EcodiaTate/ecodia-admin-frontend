import api from './client'

export interface SystemVitals {
  healthy: boolean
  db: boolean
  neo4j: boolean
  memory: { rss: number; heapUsed: number; heapTotal: number; systemFree: number }
  activeCCSessions: number
  cpu: number | null
  eventLoopLagMs: number | null
}

export async function getSystemVitals() {
  const { data } = await api.get<SystemVitals>('/workers/vitals')
  return data
}

