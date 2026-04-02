import api from './client'

export interface SymbridgeStatus {
  redis: 'connected' | 'disconnected'
  neo4j: 'connected' | 'disconnected'
  http: 'connected' | 'disconnected'
  lastInbound: string | null
  lastOutbound: string | null
  messagesSent24h: number
  messagesReceived24h: number
}

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

export interface SymbridgeMessage {
  id: string
  direction: 'inbound' | 'outbound'
  message_type: string
  source_system: string
  status: 'pending' | 'processing' | 'delivered' | 'failed'
  created_at: string
}

export async function getSymbridgeStatus() {
  const { data } = await api.get<SymbridgeStatus>('/symbridge/status')
  return data
}

export async function getOrganismVitals() {
  const { data } = await api.get<OrganismVitals>('/symbridge/health')
  return data
}

export async function getSymbridgeQueue() {
  const { data } = await api.get<SymbridgeMessage[]>('/symbridge/queue')
  return data
}
