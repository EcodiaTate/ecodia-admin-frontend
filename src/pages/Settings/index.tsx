import { useQuery } from '@tanstack/react-query'
import api from '@/api/client'
import { motion } from 'framer-motion'
import { Wifi, WifiOff, Mail, DollarSign } from 'lucide-react'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
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
    },
  ]

  return (
    <div className="max-w-4xl">
      <div className="mb-16">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
          Neural Connections
        </span>
        <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
          System <em className="not-italic font-normal text-primary">Nodes</em>
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {connections.map((conn, i) => (
          <motion.div
            key={conn.name}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.1 }}
          >
          <GlassPanel depth="elevated" className="p-8">
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
            <h2 className="mt-3 font-display text-lg font-medium text-on-surface">{conn.name}</h2>

            <div className="mt-6 flex items-center gap-3">
              <div className="relative">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${conn.connected ? 'bg-secondary/10' : 'bg-surface-container'}`}>
                  <conn.icon className={`h-5 w-5 ${conn.connected ? 'text-secondary' : 'text-on-surface-muted'}`} strokeWidth={1.75} />
                </div>
                {conn.connected && (
                  <div className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-secondary animate-pulse-glow" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {conn.connected ? (
                  <>
                    <Wifi className="h-4 w-4 text-secondary" strokeWidth={1.75} />
                    <span className="text-sm font-medium text-secondary">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-on-surface-muted" strokeWidth={1.75} />
                    <span className="text-sm text-on-surface-muted">Not connected</span>
                  </>
                )}
              </div>
            </div>

            {conn.details.length > 0 && (
              <div className="mt-4 space-y-1">
                {conn.details.map((d, j) => (
                  <p key={j} className="font-mono text-label-sm text-on-surface-muted">{d}</p>
                ))}
              </div>
            )}

            {conn.connectUrl && (
              <a
                href={conn.connectUrl}
                className="btn-primary-gradient mt-6 inline-block rounded-xl px-5 py-2.5 text-sm font-medium"
              >
                Connect
              </a>
            )}
          </GlassPanel>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
