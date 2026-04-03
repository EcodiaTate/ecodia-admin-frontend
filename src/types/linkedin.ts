export interface LinkedInDM {
  id: string
  conversation_id: string
  participant_name: string
  participant_headline: string | null
  participant_company: string | null
  participant_profile_url: string | null
  profile_id: string | null
  messages: DMMessage[]
  message_count: number
  last_message_at: string | null
  client_id: string | null
  draft_reply: string | null
  status: 'unread' | 'drafting' | 'replied' | 'ignored'
  category: DMCategory
  priority: DMPriority
  triage_summary: string | null
  triage_status: 'pending' | 'complete' | 'pending_retry' | 'failed'
  triage_attempts: number
  lead_score: number | null
  lead_signals: string[]
  is_group_chat: boolean
  // Joined fields
  profile_headline?: string
  profile_company?: string
  profile_location?: string
  profile_about?: string
  profile_relevance?: number
  profile_connection_degree?: string
  profile_mutual_connections?: number
  profile_image?: string
  client_name?: string
  client_stage?: string
  created_at: string
  updated_at: string
}

interface DMMessage {
  sender: string
  text: string
  timestamp: string | null
}

type DMPriority = 'urgent' | 'high' | 'normal' | 'low' | 'spam'

export type DMCategory = 'lead' | 'networking' | 'recruiter' | 'spam' | 'support' | 'personal' | 'uncategorized'

export interface DMStats {
  unread: number
  leads: number
  high_priority: number
  pending_triage: number
  total: number
}

export interface LinkedInPost {
  id: string
  content: string
  post_type: PostType
  hashtags: string[]
  media_paths: string[]
  scheduled_at: string | null
  posted_at: string | null
  status: 'draft' | 'scheduled' | 'posted' | 'failed'
  ai_generated: boolean
  ai_prompt: string | null
  linkedin_post_url: string | null
  theme: string | null
  impressions: number | null
  reactions: number | null
  comments_count: number | null
  reposts: number | null
  engagement_rate: number | null
  performance_scraped_at: string | null
  recurring_id: string | null
  created_at: string
  updated_at: string
}

export type PostType = 'text' | 'image' | 'carousel' | 'poll' | 'article' | 'video'

export interface PostAnalytics {
  total_posts: number
  posted: number
  scheduled: number
  drafts: number
  avg_engagement: number
  total_impressions: number
  total_reactions: number
  total_comments: number
}

export interface GeneratedPost {
  angle: string
  content: string
  hashtags: string[]
  characterCount: number
  hookLine: string
}

export interface ConnectionRequest {
  id: string
  profile_id: string | null
  linkedin_url: string
  name: string
  headline: string | null
  message: string | null
  direction: 'incoming' | 'outgoing'
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn'
  relevance_score: number | null
  relevance_reason: string | null
  scraped_at: string
  acted_on_at: string | null
  // Joined profile fields
  profile_headline?: string
  profile_company?: string
  profile_about?: string
  profile_mutual?: number
  profile_image?: string
  created_at: string
}

export interface NetworkSnapshot {
  id: string
  connection_count: number | null
  follower_count: number | null
  pending_invitations: number | null
  profile_views_week: number | null
  search_appearances_week: number | null
  post_impressions_week: number | null
  snapshot_date: string
  created_at: string
}

export interface AnalyticsSummary {
  thisWeek: { connections?: number; followers?: number; profile_views?: number; search_appearances?: number }
  lastWeek: { connections?: number; followers?: number; profile_views?: number; search_appearances?: number }
  postStats: { posts_count?: number; total_impressions?: number; avg_engagement?: number }
}

export interface ContentTheme {
  id: string
  name: string
  description: string | null
  day_of_week: number | null
  time_of_day: string | null
  prompt_template: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface ScrapeLog {
  id: string
  job_type: string
  status: 'running' | 'complete' | 'failed' | 'captcha'
  pages_scraped: number
  items_found: number
  duration_ms: number | null
  error_message: string | null
  created_at: string
}

export interface LinkedInWorkerStatus {
  status: 'active' | 'inactive' | 'suspended' | 'captcha'
  reason: string | null
  lastActive: string | null
  budgetUsage: Record<string, { used: number; limit: number; remaining: number }>
  sessionsToday: number
  maxSessionsPerDay: number
}

export interface LeadAnalysis {
  isLead: boolean
  leadScore: number
  signals: { type: string; evidence: string; strength: string }[]
  suggestedCRMAction: string
  suggestedClientData: { name: string; company: string | null; stage: string; notes: string } | null
  nextStep: string
}

export interface SuggestedPostTimes {
  suggestedSlots: { day: string; time: string; reason: string }[]
  bestDay: string
  bestTimeRange: string
  insight: string
}
