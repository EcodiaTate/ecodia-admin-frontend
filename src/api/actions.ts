import api from './client'

export interface ActionItem {
  id: string
  source: string
  source_ref_id: string | null
  action_type: string
  title: string
  summary: string | null
  prepared_data: Record<string, unknown>
  context: Record<string, unknown>
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'pending' | 'approved' | 'dismissed' | 'expired' | 'executed'
  error_message: string | null
  expires_at: string | null
  created_at: string
}

export interface ActionStats {
  pending: number
  urgent: number
  executed_24h: number
  dismissed_24h: number
}

export async function getPendingActions(limit = 20) {
  const { data } = await api.get<ActionItem[]>('/actions', { params: { limit } })
  return data
}

export async function getActionStats() {
  const { data } = await api.get<ActionStats>('/actions/stats')
  return data
}

export async function executeAction(id: string) {
  const { data } = await api.post(`/actions/${id}/execute`)
  return data
}

export async function dismissAction(id: string) {
  const { data } = await api.post(`/actions/${id}/dismiss`)
  return data
}

