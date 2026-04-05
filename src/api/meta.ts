import api from './client'
import type { MetaPost, MetaConversation, MetaStats } from '@/types/workspace'

export async function getMetaStats() {
  const { data } = await api.get<MetaStats>('/meta/stats')
  return data
}

export async function getMetaPosts(params?: { pageId?: string; limit?: number }) {
  const { data } = await api.get<MetaPost[]>('/meta/posts', { params })
  return data
}

export async function getMetaConversations(params?: { pageId?: string; limit?: number }) {
  const { data } = await api.get<MetaConversation[]>('/meta/conversations', { params })
  return data
}

export async function getMetaMessages(conversationId: string, limit = 30) {
  const { data } = await api.get<{ messages: any[] }>(`/meta/conversations/${conversationId}/messages`, { params: { limit } })
  return data.messages
}

export async function sendMetaMessage(conversationId: string, message: string) {
  const { data } = await api.post(`/meta/conversations/${conversationId}/message`, { message })
  return data
}

export async function publishMetaPost(pageId: string, message: string, link?: string, imageUrl?: string) {
  const { data } = await api.post('/meta/posts', { pageId, message, link, imageUrl })
  return data
}

export async function deleteMetaPost(postId: string) {
  const { data } = await api.delete(`/meta/posts/${postId}`)
  return data
}

export async function replyMetaComment(commentId: string, pageId: string, message: string) {
  const { data } = await api.post(`/meta/comments/${commentId}/reply`, { pageId, message })
  return data
}

export async function syncMeta() {
  const { data } = await api.post('/meta/sync')
  return data
}

export async function triageMeta() {
  const { data } = await api.post('/meta/triage')
  return data
}
