import { useState } from 'react'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { HardDrive, Cloud, Share2 } from 'lucide-react'
import { DriveTab } from './DriveTab'
import { VercelTab } from './VercelTab'
import { MetaTab } from './MetaTab'

type Tab = 'drive' | 'vercel' | 'meta'

const glide = { type: 'spring' as const, stiffness: 90, damping: 20, mass: 1 }

export default function WorkspacePage() {
  const [tab, setTab] = useState<Tab>('drive')
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  const tabs: { key: Tab; label: string; icon: typeof HardDrive }[] = [
    { key: 'drive', label: 'Drive', icon: HardDrive },
    { key: 'vercel', label: 'Vercel', icon: Cloud },
    { key: 'meta', label: 'Social', icon: Share2 },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {workers.google_drive && <AmbientPulse label="Drive" lastSyncAt={workers.google_drive.lastSync} status={workers.google_drive.status} />}
        {workers.vercel && <AmbientPulse label="Vercel" lastSyncAt={workers.vercel.lastSync} status={workers.vercel.status} />}
        {workers.meta && <AmbientPulse label="Meta" lastSyncAt={workers.meta.lastSync} status={workers.meta.status} />}
      </div>

      <SpatialLayer z={10} className="mb-8 flex items-center gap-1 rounded-2xl bg-surface-container-low/50 p-1 w-fit">
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
                layoutId="workspace-tab-bg"
                className="absolute inset-0 rounded-xl bg-white/60"
                style={{ boxShadow: '0 4px 20px -4px rgba(27, 122, 61, 0.06)' }}
                transition={glide}
              />
            )}
            <Icon className="relative h-4 w-4" strokeWidth={1.75} />
            <span className="relative">{label}</span>
          </button>
        ))}
      </SpatialLayer>

      <SpatialLayer z={-8}>
        <AnimatePresence mode="wait">
          {tab === 'drive' && (
            <motion.div key="drive" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
              <DriveTab />
            </motion.div>
          )}
          {tab === 'vercel' && (
            <motion.div key="vercel" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
              <VercelTab />
            </motion.div>
          )}
          {tab === 'meta' && (
            <motion.div key="meta" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={glide}>
              <MetaTab />
            </motion.div>
          )}
        </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}
