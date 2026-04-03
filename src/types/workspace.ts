// ─── Google Drive ────────────────────────────────────────────────────

export interface DriveFile {
  id: string
  google_file_id: string
  name: string
  mime_type: string
  parent_folder_id: string | null
  parent_folder_name: string | null
  owner_email: string | null
  web_view_link: string | null
  size_bytes: number | null
  created_time: string | null
  modified_time: string | null
  last_modifying_user: string | null
  shared: boolean
  trashed: boolean
  content_extracted: boolean
  has_content?: boolean
  embedded: boolean
  source_account: string
}

export interface DriveStats {
  total_files: number
  with_content: number
  embedded: number
  docs: number
  sheets: number
  slides: number
  pdfs: number
  last_modified: string | null
}

// ─── Vercel ─────────────────────────────────────────────────────────

export interface VercelProject {
  id: string
  vercel_project_id: string
  name: string
  framework: string | null
  git_repo: string | null
  production_url: string | null
  deployment_count: number
  last_deployed_at: string | null
}

export interface VercelDeployment {
  id: string
  vercel_deployment_id: string
  project_id: string | null
  project_name: string | null
  url: string | null
  state: 'READY' | 'ERROR' | 'BUILDING' | 'QUEUED' | 'CANCELED' | 'UNKNOWN'
  target: string | null
  git_branch: string | null
  git_commit_sha: string | null
  git_commit_message: string | null
  creator_email: string | null
  error_message: string | null
  ready_at: string | null
  created_at: string
}

export interface VercelStats {
  total_projects: number
  total_deployments: number
  deployed_24h: number
  failed_24h: number
  building_now: number
}

// ─── Meta ───────────────────────────────────────────────────────────

export interface MetaPost {
  id: string
  post_id: string
  page_id: string
  page_name: string | null
  message: string | null
  story: string | null
  permalink_url: string | null
  type: string | null
  likes_count: number
  comments_count: number
  shares_count: number
  reach: number | null
  impressions: number | null
  created_time: string | null
}

export interface MetaConversation {
  id: string
  conversation_id: string
  page_id: string
  page_name: string | null
  participant_name: string | null
  participant_id: string | null
  platform: 'messenger' | 'instagram'
  last_message_at: string | null
  last_message: string | null
  unread: boolean
}

export interface MetaStats {
  total_pages: number
  total_posts: number
  total_conversations: number
  total_messages: number
  total_followers: number
  avg_likes_30d: string | null
  avg_reach_30d: number | null
}
