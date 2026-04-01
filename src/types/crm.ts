export type PipelineStage = 'lead' | 'proposal' | 'contract' | 'development' | 'live' | 'ongoing' | 'archived'

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
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  status: 'active' | 'paused' | 'complete' | 'archived'
  repo_url: string | null
  tech_stack: string[]
  budget_aud: number | null
  hourly_rate: number | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  source: 'gmail' | 'linkedin' | 'crm' | 'manual' | 'cc'
  client_id: string | null
  project_id: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'done' | 'cancelled'
  due_date: string | null
  client_name?: string
  project_name?: string
  created_at: string
  updated_at: string
}

export type Pipeline = Record<PipelineStage, Client[]>
