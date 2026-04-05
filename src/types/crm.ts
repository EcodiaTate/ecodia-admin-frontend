export type PipelineStage = 'lead' | 'proposal' | 'contract' | 'development' | 'live' | 'ongoing' | 'archived'
export type PaymentStatus = 'none' | 'invoiced' | 'partial' | 'paid' | 'overdue'

export interface Client {
  id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  stage: PipelineStage
  priority: 'low' | 'medium' | 'high'
  notes: { content: string; createdAt: string; source: string }[]
  tags: string[]
  source: string | null
  first_contact_at: string | null
  last_contact_at: string | null
  total_revenue_aud: number | null
  lifetime_sessions: number | null
  health_score: number | null
  xero_contact_id: string | null
  meta: Record<string, unknown> | null
  created_at: string
  updated_at: string
  // Enriched by pipeline/intelligence endpoints
  email_count?: number
  open_tasks?: number
  total_sessions?: number
  pending_requests?: number
  active_projects?: number
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'complete' | 'archived'
  repo_url: string | null
  repo_path: string | null
  tech_stack: string[]
  budget_aud: number | null
  hourly_rate: number | null
  deal_value_aud: number | null
  contract_date: string | null
  estimated_hours: number | null
  actual_hours_logged: number | null
  payment_status: PaymentStatus
  invoice_ref: string | null
  created_at: string
  updated_at: string
}

export interface CRMContact {
  id: string
  client_id: string
  name: string
  role: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  is_primary: boolean
  notes: string | null
  created_at: string
}

export interface CRMActivity {
  id: string
  client_id: string
  project_id: string | null
  activity_type: string
  title: string
  description: string | null
  source: string
  source_ref_id: string | null
  source_ref_type: string | null
  actor: string | null
  metadata: Record<string, unknown>
  created_at: string
  client_name?: string
}

export type Pipeline = Record<PipelineStage, Client[]>
