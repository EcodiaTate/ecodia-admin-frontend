import api from './client'
import type { MetaPage, MetaPost, MetaConversation, MetaStats } from '@/types/workspace'

export async function getMetaStats() {
  const { data } = await api.get<MetaStats>('/meta/stats')
  return data
}

export async function getMetaPages() {
  const { data } = await api.get<MetaPage[]>('/meta/pages')
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
