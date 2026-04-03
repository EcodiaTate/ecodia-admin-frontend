import api from './client'

export interface KGStats {
  totalNodes: number
  totalRelationships: number
  embeddedNodes: number
  labelBreakdown: { label: string; count: number }[]
}

export interface KGNode {
  name: string
  labels: string[]
  [key: string]: unknown
}

export async function getKGStats() {
  const { data } = await api.get<KGStats>('/kg/stats')
  return data
}

export async function getKGNode(name: string) {
  const { data } = await api.get<KGNode>(`/kg/node/${encodeURIComponent(name)}`)
  return data
}

export async function getKGNeighborhood(name: string, depth?: number) {
  const { data } = await api.get<KGNode[]>(`/kg/node/${encodeURIComponent(name)}/neighborhood`, {
    params: { depth },
  })
  return data
}

export async function getKGBriefing(query: string) {
  const { data } = await api.get<{ briefing: string | null; raw: string }>('/kg/briefing', {
    params: { q: query },
  })
  return data
}

// ── Consolidation ─────────────────────────────────────────────────────

export interface ConsolidationStats {
  lastRun: string | null
  patternsFound: number
  nodesConsolidated: number
  narrativesCreated: number
  nextScheduled: string | null
  status: 'idle' | 'running' | 'error'
}

export async function getConsolidationStats() {
  const { data } = await api.get<ConsolidationStats>('/kg/consolidation/stats')
  return data
}
