import { useState, lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Mail, DollarSign, HardDrive, Cloud, Share2, Brain, Network, Layers, Terminal } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import { cn } from '@/lib/utils'

const WorkspaceView = lazy(() => import('../Workspace'))
const FactoryDevView = lazy(() => import('../FactoryDev'))

type Tab = 'connections' | 'surfaces' | 'factory'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('connections')

  const tabs: { key: Tab; label: string; icon: typeof Network }[] = [
    { key: 'connections', label: 'Connections', icon: Network },
    { key: 'surfaces', label: 'Surfaces', icon: Layers },
    { key: 'factory', label: 'Factory', icon: Terminal },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-10">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Neural Connections
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          System <em className="not-italic font-normal text-primary">Nodes</em>
        </h1>
      </SpatialLayer>

      {/* Tabs */}
      <SpatialLayer z={10} className="mb-8">
        <div className="flex gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium',
                tab === key ? 'text-primary' : 'text-on-surface-muted hover:text-on-surface-variant',
              )}
            >
              {tab === key && (
                <motion.div
                  layoutId="settings-tab-bg"
                  className="absolute inset-0 rounded-xl bg-white/60"
                  style={{ boxShadow: '0 4px 20px -4px rgba(27, 122, 61, 0.06)' }}
                  transition={glide}
                />
              )}
              <Icon className="relative h-4 w-4" strokeWidth={1.75} />
              <span className="relative">{label}</span>
            </button>
          ))}
        </div>
      </SpatialLayer>

      <AnimatePresence mode="wait">
        {tab === 'connections' ? (
          <motion.div key="connections" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <ConnectionsTab />
          </motion.div>
        ) : tab === 'surfaces' ? (
          <motion.div key="surfaces" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <Suspense fallback={<LoadingSpinner />}>
              <WorkspaceView />
            </Suspense>
          </motion.div>
        ) : (
          <motion.div key="factory" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
            <Suspense fallback={<LoadingSpinner />}>
              <FactoryDevView />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Connections Tab (original Settings content) ─────────────────────

function ConnectionsTab() {
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

  return (
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
  )
}
