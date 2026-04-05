import { useAuthStore } from '@/store/authStore'

export interface KGExplorerStatus {
  connected: boolean
}

export interface KGExplorerQueryResult {
  keys: string[]
  rows: Record<string, unknown>[]
  count: number
  durationMs: number
}

// KG Explorer endpoints are mounted at /kg-explorer, not /api/kg-explorer
// Use the base URL without the /api prefix
const KG_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/api\/?$/, '')

async function kgFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = useAuthStore.getState().token
  const res = await fetch(`${KG_BASE}/kg-explorer${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  })
  if (res.status === 401) {
    useAuthStore.getState().logout()
    throw new Error('Session expired')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(body.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getExplorerStatus(): Promise<KGExplorerStatus> {
  return kgFetch('/status')
}

export async function runCypherQuery(cypher: string, params?: Record<string, unknown>): Promise<KGExplorerQueryResult> {
  return kgFetch('/query', {
    method: 'POST',
    body: JSON.stringify({ cypher, params: params || {} }),
  })
}
