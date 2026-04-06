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

export interface OSThinkBlock {
  type: 'think'
  content: string
}

export interface OSDelegateBlock {
  type: 'delegate'
  workspace: string
  prompt: string
}

export interface OSDelegateResultBlock {
  type: 'delegate_result'
  workspace: string
  prompt?: string
  success: boolean
  result?: string
  error?: string
  rounds?: number
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
  | OSThinkBlock
  | OSDelegateBlock
  | OSDelegateResultBlock

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

// ── Orchestration progress events (streamed via WebSocket) ──

export type OSProgressEvent =
  | { event: 'orchestration_start'; workspace: string }
  | { event: 'round_start'; round: number }
  | { event: 'think'; content: string }
  | { event: 'text'; content: string }
  | { event: 'delegation_start'; workspace: string; prompt: string }
  | { event: 'delegation_complete'; workspace: string; success: boolean; rounds?: number; error?: string }
  | { event: 'parallel_start'; count: number; workspaces: string[] }
  | { event: 'parallel_complete'; count: number; successes: number }
  | { event: 'action_start'; action: string }
  | { event: 'question'; content: string }
  | { event: 'done'; summary: string }
  | { event: 'orchestration_complete'; rounds: number; status: string }
