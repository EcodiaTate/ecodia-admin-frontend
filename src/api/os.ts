import api from './client'
import type {
  OSRunResponse,
  OSWorkspace,
  OSTaskSession,
  OSTaskSummary,
  OSDoc,
  OSCoreFact,
} from '@/types/os'

// 5 minute timeout for multi-turn task execution
const LONG_TIMEOUT = 300_000

export async function runOSTask(
  workspace: string,
  messages: { role: 'user' | 'assistant'; content: string }[],
  taskId?: string,
) {
  const { data } = await api.post<OSRunResponse>('/os/run', {
    workspace,
    messages,
    taskId,
  }, { timeout: LONG_TIMEOUT })
  return data
}

export async function getWorkspaces() {
  const { data } = await api.get<{ workspaces: OSWorkspace[] }>('/os/workspaces')
  return data.workspaces
}

export async function getTasks(workspace?: string, status?: string) {
  const { data } = await api.get<{ tasks: OSTaskSummary[] }>('/os/tasks', {
    params: { ...(workspace && { workspace }), ...(status && { status }) },
  })
  return data.tasks
}

export async function getTask(id: string) {
  const { data } = await api.get<{ task: OSTaskSession }>(`/os/tasks/${id}`)
  return data.task
}

export async function getDocs(workspace?: string) {
  const { data } = await api.get<{ docs: OSDoc[] }>('/os/docs', {
    params: workspace ? { workspace } : {},
  })
  return data.docs
}

export async function getDoc(key: string) {
  const { data } = await api.get<{ doc: OSDoc }>(`/os/docs/${key}`)
  return data.doc
}

export async function upsertDoc(key: string, title: string, content: string, workspace?: string) {
  const { data } = await api.put(`/os/docs/${key}`, { title, content, workspace })
  return data
}

export async function getCoreContext() {
  const { data } = await api.get<{ facts: OSCoreFact[] }>('/os/context')
  return data.facts
}

export async function updateCoreContext(key: string, value: string) {
  const { data } = await api.put('/os/context', { key, value })
  return data
}
