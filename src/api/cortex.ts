import api from './client'
import type {
  CortexChatResponse,
  CortexBriefingResponse,
  CortexActionResponse,
  AttachedFile,
} from '@/types/cortex'

export async function sendCortexChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  sessionId?: string,
  attachments?: AttachedFile[],
  ambientEvents?: { kind: string; summary: string; timestamp: Date }[],
) {
  // Use /cortex/do for auto-execution: Cortex proposes actions → they run → results feed back
  // 3 minute timeout — multi-turn can chain several DeepSeek calls + action executions
  const { data } = await api.post<CortexChatResponse>('/cortex/do', {
    messages,
    sessionId,
    attachments: attachments?.map(a => ({
      name: a.name,
      type: a.type,
      size: a.size,
      dataUrl: a.dataUrl,
      text: a.text,
    })),
    ambientEvents,
  }, { timeout: 180_000 })
  return data
}

export async function getCortexBriefing() {
  const { data } = await api.get<CortexBriefingResponse>('/cortex/briefing')
  return data
}

export async function executeCortexAction(
  action: string,
  params: Record<string, unknown>,
) {
  const { data } = await api.post<CortexActionResponse>('/cortex/action', {
    action,
    params,
  })
  return data
}
