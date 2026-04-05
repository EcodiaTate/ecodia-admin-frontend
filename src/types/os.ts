// ═══════════════════════════════════════════════════════════════════════
// OS CORTEX TYPES — separate from organism cortex types
// ═══════════════════════════════════════════════════════════════════════

export interface OSTextBlock {
  type: 'text'
  content: string
}

export interface OSActionCardBlock {
  type: 'action_card'
  action: string
  params: Record<string, unknown>
  title?: string
}

export interface OSActionResultBlock {
  type: 'action_result'
  action: string
  success: boolean
  result?: unknown
  error?: string
}

export interface OSQuestionBlock {
  type: 'question'
  content: string
}

export interface OSDoneBlock {
  type: 'done'
  summary: string
}

export interface OSNeedDocBlock {
  type: 'need_doc'
  docKey: string
}

export interface OSUpdateDocBlock {
  type: 'update_doc'
  docKey: string
  title: string
  content: string
}

export interface OSUpdateContextBlock {
  type: 'update_context'
  key: string
  value: string
}

export type OSBlock =
  | OSTextBlock
  | OSActionCardBlock
  | OSActionResultBlock
  | OSQuestionBlock
  | OSDoneBlock
  | OSNeedDocBlock
  | OSUpdateDocBlock
  | OSUpdateContextBlock

export interface OSWorkspace {
  name: string
  label: string
  description: string
}

export interface OSTaskSession {
  id: string
  workspace: string
  title: string | null
  status: 'active' | 'paused' | 'completed'
  history: OSHistoryTurn[]
  created_at: string
  updated_at: string
}

export interface OSTaskSummary {
  id: string
  workspace: string
  title: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface OSHistoryTurn {
  ts: string
  role: 'user' | 'assistant' | 'system'
  content: string
  blocks?: OSBlock[]
}

export interface OSDoc {
  id: string
  key: string
  title: string
  content: string
  workspace: string | null
  updated_by: string
  created_at: string
  updated_at: string
}

export interface OSCoreFact {
  key: string
  value: string
}

export interface OSRunResponse {
  blocks: OSBlock[]
  taskId: string
  status: 'active' | 'paused' | 'completed'
  rounds: number
}

export interface OSChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  blocks?: OSBlock[]
  timestamp: Date
}
