import { create } from 'zustand'

export interface WorkerStatus {
  worker: string
  lastSync: string
  status: 'active' | 'error' | 'stale'
  error?: string | null
}

interface WorkerStore {
  workers: Record<string, WorkerStatus>
  updateWorker: (ws: WorkerStatus) => void
  setWorkers: (workers: Record<string, WorkerStatus>) => void
}

export const useWorkerStore = create<WorkerStore>((set) => ({
  workers: {},
  updateWorker: (ws) =>
    set((state) => ({
      workers: { ...state.workers, [ws.worker]: ws },
    })),
  setWorkers: (workers) => set({ workers }),
}))
