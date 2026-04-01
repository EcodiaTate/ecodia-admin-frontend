export interface CCSession {
  id: string
  cc_session_id: string | null
  project_id: string | null
  client_id: string | null
  triggered_by: 'crm_stage' | 'manual' | 'task'
  initial_prompt: string
  status: 'initializing' | 'running' | 'awaiting_input' | 'complete' | 'error'
  working_dir: string | null
  cc_cost_usd: number | null
  started_at: string
  completed_at: string | null
  error_message: string | null
  project_name?: string
  client_name?: string
}

export interface CCSessionLog {
  chunk: string
  created_at: string
}
