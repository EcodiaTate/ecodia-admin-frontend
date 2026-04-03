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

/**
 * Inline Claude Code session — lives directly in the chat thread.
 * The backend returns this block when it creates a CC session on the user's behalf.
 * The frontend then subscribes to live output via WebSocket and renders it inline.
 */
export interface CCSessionBlock {
  type: 'cc_session'
  sessionId: string       // maps to CCSession.id
  title: string           // short description of what was asked
}

export type CortexBlock =
  | TextBlock
  | ActionCardBlock
  | EmailCardBlock
  | TaskCardBlock
  | StatusUpdateBlock
  | InsightBlock
  | CCSessionBlock

export interface AttachedFile {
  id: string
  name: string
  type: string          // MIME type
  size: number
  dataUrl?: string      // for images — used for preview
  text?: string         // for text/doc files — extracted text content
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string            // raw text for user messages
  blocks?: CortexBlock[]     // structured blocks for assistant messages
  mentionedNodes?: string[]  // nodes highlighted in constellation
  attachments?: AttachedFile[]
  timestamp: Date
}

/**
 * Ambient system event — an observation from the environment that the Cortex
 * can see and optionally react to. Not a user message, not an assistant reply.
 * Rendered as a subtle inline note in the chat stream.
 *
 * Examples: "create_sheet failed: 500", "CC session abc123 completed",
 * "action dismissed by user", "email sent successfully"
 */
export interface AmbientEvent {
  id: string
  kind: 'action_success' | 'action_failure' | 'action_dismissed' | 'action_expired' | 'cc_complete' | 'cc_error' | 'cc_deployed' | 'cc_deploy_failed' | 'cc_started' | 'organism_surfacing' | 'system'
  summary: string           // one-line human-readable summary
  detail?: string           // raw response / error body (for the AI to read)
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
