import api from './client'
import type {
  CortexChatResponse,
  CortexBriefingResponse,
  CortexActionResponse,
} from '@/types/cortex'

export async function sendCortexChat(
  messages: { role: 'user' | 'assistant'; content: string }[],
  sessionId?: string,
) {
  const { data } = await api.post<CortexChatResponse>('/cortex/chat', {
    messages,
    sessionId,
  })
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
