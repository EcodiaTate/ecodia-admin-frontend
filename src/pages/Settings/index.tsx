import { useQuery, useMutation } from '@tanstack/react-query'
import api from '@/api/client'
import { syncFinance } from '@/api/finance'
import { syncGmail } from '@/api/gmail'
import { syncDrive } from '@/api/drive'
import { syncVercel } from '@/api/vercel'
import { syncMeta } from '@/api/meta'
import { triggerEmbedding } from '@/api/knowledgeGraph'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Mail, DollarSign, HardDrive, Cloud, Share2, Brain, RefreshCw, Network } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data
    },
  })

  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const syncFinanceMut = useMutation({ mutationFn: syncFinance, onSuccess: () => toast.success('Finance sync triggered'), onError: () => toast.error('Finance sync failed') })
  const syncGmailMut = useMutation({ mutationFn: syncGmail, onSuccess: () => toast.success('Gmail sync triggered'), onError: () => toast.error('Gmail sync failed') })
  const syncDriveMut = useMutation({ mutationFn: syncDrive, onSuccess: () => toast.success('Drive sync triggered'), onError: () => toast.error('Drive sync failed') })
  const syncVercelMut = useMutation({ mutationFn: syncVercel, onSuccess: () => toast.success('Vercel sync triggered'), onError: () => toast.error('Vercel sync failed') })
  const syncMetaMut = useMutation({ mutationFn: syncMeta, onSuccess: () => toast.success('Meta sync triggered'), onError: () => toast.error('Meta sync failed') })
  const embedMut = useMutation({ mutationFn: triggerEmbedding, onSuccess: (d) => toast.success(`Embedded ${d.embedded} nodes`), onError: () => toast.error('Embedding failed') })

  const connections = [
    {
      name: 'Xero Connection',
      icon: DollarSign,
      category: 'Financial Protocol',
      connected: data?.xero?.connected,
      workerKey: 'finance',
      details: data?.xero?.connected ? [
        `Token expires: ${new Date(data.xero.expiresAt).toLocaleString()}`,
        `Last refresh: ${new Date(data.xero.lastRefresh).toLocaleString()}`,
      ] : [],
      connectUrl: data?.xero?.connected ? undefined :
        `https://login.xero.com/identity/connect/authorize?response_type=code&client_id=${encodeURIComponent('XERO_CLIENT_ID')}&redirect_uri=${encodeURIComponent(window.location.origin + '/api/finance/xero/callback')}&scope=openid profile email accounting.transactions accounting.settings offline_access&state=ecodia`,
      onSync: () => syncFinanceMut.mutate(),
      syncing: syncFinanceMut.isPending,
    },
    {
      name: 'Gmail Connection',
      icon: Mail,
      category: 'Communication Node',
      connected: data?.gmail?.connected,
      workerKey: 'gmail',
      details: data?.gmail?.connected ? [
        `History ID: ${data.gmail.historyId}`,
        `Last sync: ${new Date(data.gmail.lastSync).toLocaleString()}`,
      ] : ['Requires Google service account setup on VPS'],
      onSync: () => syncGmailMut.mutate(),
      syncing: syncGmailMut.isPending,
    },
    {
      name: 'Google Drive',
      icon: HardDrive,
      category: 'Storage Plane',
      connected: true,
      workerKey: 'google_drive',
      details: [],
      onSync: () => syncDriveMut.mutate(),
      syncing: syncDriveMut.isPending,
    },
    {
      name: 'Vercel',
      icon: Cloud,
      category: 'Deployment Layer',
      connected: true,
      workerKey: 'vercel',
      details: [],
      onSync: () => syncVercelMut.mutate(),
      syncing: syncVercelMut.isPending,
    },
    {
      name: 'Meta / Facebook',
      icon: Share2,
      category: 'Social Surface',
      connected: true,
      workerKey: 'meta',
      details: [],
      onSync: () => syncMetaMut.mutate(),
      syncing: syncMetaMut.isPending,
    },
    {
      name: 'LinkedIn',
      icon: Network,
      category: 'Influence Network',
      connected: true,
      workerKey: 'linkedin',
      details: [],
    },
    {
      name: 'Knowledge Graph',
      icon: Brain,
      category: 'World Model',
      connected: true,
      workerKey: 'kg_consolidation',
      details: [],
      onSync: () => embedMut.mutate(),
      syncing: embedMut.isPending,
      syncLabel: 'Embed',
    },
  ]

  // Compute aggregate worker health
  const workerEntries = Object.values(workers)
  const activeCount = workerEntries.filter(w => w.status === 'active').length
  const errorCount = workerEntries.filter(w => w.status === 'error').length

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Neural Connections
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            System <em className="not-italic font-normal text-primary">Nodes</em>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 sm:pt-2">
          <WhisperStat label="Active Workers" value={activeCount} accent="text-secondary" />
          {errorCount > 0 && <WhisperStat label="Errors" value={errorCount} accent="text-error" />}
          <WhisperStat label="Total Workers" value={workerEntries.length} />
        </div>
      </SpatialLayer>

      {/* Worker status strip */}
      <SpatialLayer z={15} className="mb-10">
        <h3 className="mb-4 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
          Worker Heartbeats
        </h3>
        <div className="flex flex-wrap gap-3">
          {workerEntries.map(w => (
            <AmbientPulse key={w.worker} label={w.worker} lastSyncAt={w.lastSync} status={w.status} />
          ))}
          {workerEntries.length === 0 && (
            <span className="text-sm text-on-surface-muted/40">No workers reporting</span>
          )}
        </div>
      </SpatialLayer>

      {/* Integration cards */}
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

            <div className="mt-5 flex items-center gap-3">
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

            {conn.details.length > 0 && (
              <div className="mt-3 space-y-1">
                {conn.details.map((d, j) => (
                  <p key={j} className="font-mono text-label-sm text-on-surface-muted">{d}</p>
                ))}
              </div>
            )}

            <div className="mt-4 flex gap-2">
              {conn.onSync && conn.connected && (
                <button
                  onClick={conn.onSync}
                  disabled={conn.syncing}
                  className="flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/15 disabled:opacity-40"
                >
                  <RefreshCw className={`h-3 w-3 ${conn.syncing ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                  {conn.syncing ? 'Syncing...' : conn.syncLabel || 'Sync Now'}
                </button>
              )}
              {conn.connectUrl && (
                <a
                  href={conn.connectUrl}
                  className="btn-primary-gradient inline-block rounded-xl px-4 py-2 text-xs font-medium"
                >
                  Connect
                </a>
              )}
            </div>
          </GlassPanel>
          </motion.div>
        ))}
      </SpatialLayer>
    </div>
  )
}
