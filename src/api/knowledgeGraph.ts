import api from './client'

export interface KGContextResult {
  traces: unknown[]
  summary: string
}

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

export async function getKGContext(query: string, opts?: { seeds?: number; depth?: number }) {
  const { data } = await api.get<KGContextResult>('/kg/context', {
    params: { q: query, seeds: opts?.seeds, depth: opts?.depth },
  })
  return data
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

export async function triggerEmbedding() {
  const { data } = await api.post<{ embedded: number }>('/kg/embed')
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

export async function triggerConsolidation(dryRun = false) {
  const { data } = await api.post<{ status: string; message: string }>('/kg/consolidation/run', null, {
    params: dryRun ? { dryRun: 'true' } : undefined,
  })
  return data
}

export async function getKGHealth() {
  const { data } = await api.get<{ neo4j: 'connected' | 'disconnected' }>('/kg/health')
  return data
}
