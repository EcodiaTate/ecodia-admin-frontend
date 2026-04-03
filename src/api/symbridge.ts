import api from './client'

export interface OrganismVitals {
  ecodiaos: {
    healthy: boolean
    db: boolean
    neo4j: boolean
    memory: { rss: number; heapUsed: number; heapTotal: number; systemFree: number }
    activeCCSessions: number
  }
  organism: {
    healthy: boolean | null
    lastCheck: string | null
    consecutiveFailures: number
    lastResponseMs: number | null
    data?: Record<string, unknown>
  }
  timestamp: string
}

export async function getOrganismVitals() {
  const { data } = await api.get<OrganismVitals>('/symbridge/health')
  return data
}

