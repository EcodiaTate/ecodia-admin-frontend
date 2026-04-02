import api from './client'
import type { DriveFile, DriveStats, DriveFolderNode } from '@/types/workspace'

export async function getDriveStats() {
  const { data } = await api.get<DriveStats>('/drive/stats')
  return data
}

export async function searchDrive(query: string, limit = 20) {
  const { data } = await api.post<DriveFile[]>('/drive/search', { query, limit })
  return data
}

export async function getDriveTree() {
  const { data } = await api.get<DriveFolderNode[]>('/drive/tree')
  return data
}

export async function syncDrive() {
  const { data } = await api.post('/drive/sync')
  return data
}

export async function extractDriveContent(batchSize = 20) {
  const { data } = await api.post('/drive/extract', { batchSize })
  return data
}

export async function createDocument(title: string, content?: string, folderId?: string) {
  const { data } = await api.post('/drive/doc', { title, content, folderId })
  return data
}

export async function createSpreadsheet(title: string, folderId?: string) {
  const { data } = await api.post('/drive/sheet', { title, folderId })
  return data
}

export async function createFolder(name: string, parentFolderId?: string) {
  const { data } = await api.post('/drive/folder', { name, parentFolderId })
  return data
}

export async function uploadFile(name: string, content: string, mimeType?: string, folderId?: string) {
  const { data } = await api.post('/drive/upload', { name, content, mimeType, folderId })
  return data
}
