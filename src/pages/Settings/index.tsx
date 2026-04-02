import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/api/client'
import { syncFinance } from '@/api/finance'
import { syncMeta } from '@/api/meta'
import { syncVercel } from '@/api/vercel'
import { triggerEmbedding } from '@/api/knowledgeGraph'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Mail, DollarSign, HardDrive, Cloud, Share2, Brain, Network, RefreshCw } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data
    },
  })

  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const syncGmail = useMutation({
    mutationFn: () => api.post('/gmail/sync'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gmailThreads'] })
      toast.success('Gmail sync triggered')
    },
    onError: () => toast.error('Gmail sync failed'),
  })

  const syncXero = useMutation({
    mutationFn: syncFinance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financeSummary'] })
      toast.success('Xero synced')
    },
    onError: () => toast.error('Xero sync failed'),
  })

  const syncMetaMut = useMutation({
    mutationFn: syncMeta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaStats'] })
      toast.success('Meta synced')
    },
    onError: () => toast.error('Meta sync failed'),
  })

  const syncVercelMut = useMutation({
    mutationFn: syncVercel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vercelStats'] })
      toast.success('Vercel synced')
    },
    onError: () => toast.error('Vercel sync failed'),
  })

  const embedKG = useMutation({
    mutationFn: triggerEmbedding,
    onSuccess: (res) => toast.success(`Embedded ${res.embedded} KG nodes`),
    onError: () => toast.error('KG embedding failed'),
  })

  type SyncFn = () => void

  const connections: {
    name: string
    icon: React.ElementType
    category: string
    connected: boolean | undefined
    workerKey: string
    syncFn?: SyncFn
    syncPending?: boolean
  }[] = [
    {
      name: 'Xero',
      icon: DollarSign,
      category: 'Financial Protocol',
      connected: data?.xero?.connected,
      workerKey: 'finance',
      syncFn: () => syncXero.mutate(),
      syncPending: syncXero.isPending,
    },
    {
      name: 'Gmail',
      icon: Mail,
      category: 'Communication',
      connected: data?.gmail?.connected,
      workerKey: 'gmail',
      syncFn: () => syncGmail.mutate(),
      syncPending: syncGmail.isPending,
    },
    {
      name: 'Google Drive',
      icon: HardDrive,
      category: 'Storage',
      connected: true,
      workerKey: 'google_drive',
    },
    {
      name: 'Vercel',
      icon: Cloud,
      category: 'Deployment',
      connected: true,
      workerKey: 'vercel',
      syncFn: () => syncVercelMut.mutate(),
      syncPending: syncVercelMut.isPending,
    },
    {
      name: 'Meta',
      icon: Share2,
      category: 'Social',
      connected: true,
      workerKey: 'meta',
      syncFn: () => syncMetaMut.mutate(),
      syncPending: syncMetaMut.isPending,
    },
    {
      name: 'LinkedIn',
      icon: Network,
      category: 'Influence',
      connected: true,
      workerKey: 'linkedin',
    },
    {
      name: 'Knowledge Graph',
      icon: Brain,
      category: 'World Model',
      connected: true,
      workerKey: 'kg_consolidation',
      syncFn: () => embedKG.mutate(),
      syncPending: embedKG.isPending,
    },
  ]

  return (
    <div className="mx-auto max-w-4xl">
      <SpatialLayer z={25} className="mb-14">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Neural Connections
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          System <em className="not-italic font-normal text-primary">Nodes</em>
        </h1>
      </SpatialLayer>

      <SpatialLayer z={5} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 sm:gap-8">
        {connections.map((conn, i) => (
          <motion.div
            key={conn.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.06 }}
          >
            <GlassPanel depth="elevated" className="p-7">
              <div className="flex items-start justify-between">
                <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted">
                  {conn.category}
                </span>
                {workers[conn.workerKey] && (
                  <AmbientPulse
                    label={conn.workerKey}
                    lastSyncAt={workers[conn.workerKey].lastSync}
                    status={workers[conn.workerKey].status}
                  />
                )}
              </div>

              <h2 className="mt-3 font-display text-sm font-medium text-on-surface">{conn.name}</h2>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${conn.connected ? 'bg-secondary/10' : 'bg-surface-container'}`}>
                      <conn.icon className={`h-4 w-4 ${conn.connected ? 'text-secondary' : 'text-on-surface-muted'}`} strokeWidth={1.75} />
                    </div>
                    {conn.connected && (
                      <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-secondary animate-pulse-glow" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {conn.connected ? (
                      <>
                        <Wifi className="h-3.5 w-3.5 text-secondary" strokeWidth={1.75} />
                        <span className="text-sm font-medium text-secondary">Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3.5 w-3.5 text-on-surface-muted" strokeWidth={1.75} />
                        <span className="text-sm text-on-surface-muted">Not connected</span>
                      </>
                    )}
                  </div>
                </div>

                {conn.syncFn && conn.connected && (
                  <button
                    onClick={conn.syncFn}
                    disabled={conn.syncPending}
                    title="Sync now"
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-on-surface-muted/50 transition-colors hover:bg-surface-container hover:text-on-surface-muted disabled:opacity-30"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${conn.syncPending ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                  </button>
                )}
              </div>
            </GlassPanel>
          </motion.div>
        ))}
      </SpatialLayer>
    </div>
  )
}
