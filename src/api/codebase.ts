import api from './client'

export interface Codebase {
  id: string
  name: string
  repo_url: string | null
  repo_path: string
  mirror_path: string | null
  language: string | null
  project_id: string | null
  chunk_count: number
  file_count: number
  created_at: string
  last_indexed_at: string | null
}

export interface CodebaseStats {
  totalChunks: number
  totalFiles: number
  embeddedChunks: number
  languages: { language: string; count: number }[]
  lastIndexed: string | null
}

export interface SemanticSearchResult {
  chunk_id: string
  file_path: string
  content: string
  similarity: number
  codebase_name?: string
  language?: string
}

export interface CodebaseStructure {
  tree: string
  fileCount: number
}

export async function getCodebases() {
  const { data } = await api.get<Codebase[]>('/codebase')
  return data
}

export async function getCodebase(id: string) {
  const { data } = await api.get<Codebase & { stats: CodebaseStats }>(`/codebase/${id}`)
  return data
}

export async function registerCodebase(body: { name: string; repoUrl?: string; repoPath: string; mirrorPath?: string; language?: string; projectId?: string }) {
  const { data } = await api.post<Codebase>('/codebase', body)
  return data
}

export async function indexCodebase(id: string) {
  const { data } = await api.post<{ indexed: number; embedded: number }>(`/codebase/${id}/index`)
  return data
}

export async function queryCodebase(id: string, query: string, limit = 20) {
  const { data } = await api.post<SemanticSearchResult[]>(`/codebase/${id}/query`, { query, limit })
  return data
}

export async function queryCrossCodebase(query: string, limit = 20) {
  const { data } = await api.post<SemanticSearchResult[]>('/codebase/query', { query, limit })
  return data
}

export async function getCodebaseStructure(id: string) {
  const { data } = await api.get<CodebaseStructure>(`/codebase/${id}/structure`)
  return data
}
