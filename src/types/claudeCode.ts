export interface CCSession {
  id: string
  cc_session_id: string | null
  project_id: string | null
  client_id: string | null
  codebase_id: string | null
  triggered_by: 'crm_stage' | 'manual' | 'task' | 'simula' | 'thymos' | 'scheduled' | 'cortex' | 'email' | 'proactive' | string
  trigger_source: string | null
  initial_prompt: string
  status: 'initializing' | 'running' | 'awaiting_input' | 'complete' | 'error' | 'stopped' | 'paused'
  pipeline_stage: 'queued' | 'context' | 'executing' | 'testing' | 'reviewing' | 'deploying' | 'deployed' | 'awaiting_review' | 'complete' | 'failed' | 'error' | null
  confidence_score: number | null
  files_changed: string[] | null
  commit_sha: string | null
  deploy_status: string | null
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
