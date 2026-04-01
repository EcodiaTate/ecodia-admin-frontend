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

export async function triggerEmbedding() {
  const { data } = await api.post<{ embedded: number }>('/kg/embed')
  return data
}
