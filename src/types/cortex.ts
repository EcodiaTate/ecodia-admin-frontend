// ═══════════════════════════════════════════════════════════════════════
// CORTEX TYPES
// Structured blocks, chat messages, and action types for
// the conversational intelligence interface.
// ═══════════════════════════════════════════════════════════════════════

export interface TextBlock {
  type: 'text'
  content: string
}

export interface ActionCardBlock {
  type: 'action_card'
  title: string
  description: string
  action: 'send_email' | 'archive_email' | 'create_task' | 'update_crm_stage' | 'draft_reply' | 'create_calendar_event' | 'start_cc_session' | 'create_doc' | 'create_sheet' | 'write_sheet' | 'upload_file' | 'search_drive'
  params: Record<string, unknown>
  urgency: 'low' | 'medium' | 'high'
}

export interface EmailCardBlock {
  type: 'email_card'
  threadId: string
  from: string
  subject: string
  summary: string
  priority: string
  receivedAt: string
}

export interface TaskCardBlock {
  type: 'task_card'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  source: string
}

export interface StatusUpdateBlock {
  type: 'status_update'
  message: string
  count: number | null
}

export interface InsightBlock {
  type: 'insight'
  message: string
  urgency: 'low' | 'medium' | 'high'
}

export type CortexBlock =
  | TextBlock
  | ActionCardBlock
  | EmailCardBlock
  | TaskCardBlock
  | StatusUpdateBlock
  | InsightBlock

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string            // raw text for user messages
  blocks?: CortexBlock[]     // structured blocks for assistant messages
  mentionedNodes?: string[]  // nodes highlighted in constellation
  timestamp: Date
}

export interface CortexChatResponse {
  blocks: CortexBlock[]
  mentionedNodes: string[]
  rawKgContext: string
}

export interface CortexBriefingResponse {
  blocks: CortexBlock[]
  mentionedNodes: string[]
}

export interface CortexActionResponse {
  success: boolean
  message: string
  draft?: string
  task?: Record<string, unknown>
}
