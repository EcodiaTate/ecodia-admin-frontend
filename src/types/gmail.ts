export interface EmailThread {
  id: string
  gmail_thread_id: string
  subject: string | null
  from_email: string
  from_name: string | null
  snippet: string | null
  full_body: string | null
  triage_priority: 'urgent' | 'high' | 'normal' | 'low' | 'spam'
  triage_summary: string | null
  triage_action: string | null
  draft_reply: string | null
  triage_status: 'pending' | 'complete' | 'pending_retry' | 'failed'
  status: 'unread' | 'triaged' | 'replied' | 'archived'
  inbox: string | null
  received_at: string | null
  created_at: string
  updated_at: string
}
