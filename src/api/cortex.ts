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
) {
  const { data } = await api.post<CortexChatResponse>('/cortex/chat', {
    messages,
    sessionId,
    attachments: attachments?.map(a => ({
      name: a.name,
      type: a.type,
      size: a.size,
      // Send image dataUrls and extracted text — backend decides what to pass to Claude
      dataUrl: a.dataUrl,
      text: a.text,
    })),
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
