import { KPICards } from './KPICards'
import { ActivityFeed } from './ActivityFeed'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'

export default function DashboardPage() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Ecosystem Overview
          </span>
          <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
            Atmospheric <em className="not-italic font-normal text-primary">Vitals</em>
          </h1>
        </div>

        {/* Ambient sync pulses */}
        <div className="flex items-center gap-4 pt-2">
          {workers.gmail && <AmbientPulse label="Gmail" lastSyncAt={workers.gmail.lastSync} status={workers.gmail.status} />}
          {workers.finance && <AmbientPulse label="Xero" lastSyncAt={workers.finance.lastSync} status={workers.finance.status} />}
          {workers.linkedin && <AmbientPulse label="LinkedIn" lastSyncAt={workers.linkedin.lastSync} status={workers.linkedin.status} />}
        </div>
      </div>

      <KPICards />

      <div className="mt-20">
        <ActivityFeed />
      </div>
    </div>
  )
}
