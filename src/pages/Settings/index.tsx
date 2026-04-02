import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Mail, DollarSign, HardDrive, Cloud, Share2, Brain, Network } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'

export default function SettingsPage() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data } = await api.get('/settings')
      return data
    },
  })

  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const connections = [
    { name: 'Xero', icon: DollarSign, category: 'Financial Protocol', connected: data?.xero?.connected, workerKey: 'finance' },
    { name: 'Gmail', icon: Mail, category: 'Communication', connected: data?.gmail?.connected, workerKey: 'gmail' },
    { name: 'Google Drive', icon: HardDrive, category: 'Storage', connected: true, workerKey: 'google_drive' },
    { name: 'Vercel', icon: Cloud, category: 'Deployment', connected: true, workerKey: 'vercel' },
    { name: 'Meta', icon: Share2, category: 'Social', connected: true, workerKey: 'meta' },
    { name: 'LinkedIn', icon: Network, category: 'Influence', connected: true, workerKey: 'linkedin' },
    { name: 'Knowledge Graph', icon: Brain, category: 'World Model', connected: true, workerKey: 'kg_consolidation' },
  ]

  const workerEntries = Object.values(workers)
  const activeCount = workerEntries.filter(w => w.status === 'active').length

  return (
    <div className="mx-auto max-w-4xl">
      <SpatialLayer z={25} className="mb-14">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
          Neural Connections
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          System <em className="not-italic font-normal text-primary">Nodes</em>
        </h1>
        <p className="mt-3 text-sm text-on-surface-muted/50">
          {activeCount} of {workerEntries.length} workers active
        </p>
      </SpatialLayer>

      {/* Connection status — read-only, no controls */}
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
            </GlassPanel>
          </motion.div>
        ))}
      </SpatialLayer>
    </div>
  )
}
