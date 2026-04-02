import { KPICards } from './KPICards'
import { ActivityFeed } from './ActivityFeed'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'

export default function DashboardPage() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  return (
    <div className="mx-auto max-w-5xl preserve-3d-deep">
      {/* Header — floats closest to viewer */}
      <SpatialLayer z={25} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Ecosystem Overview
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            Atmospheric <em className="not-italic font-normal text-primary">Vitals</em>
          </h1>
        </div>

        {/* Ambient sync pulses */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 sm:pt-2">
          {workers.gmail && <AmbientPulse label="Gmail" lastSyncAt={workers.gmail.lastSync} status={workers.gmail.status} />}
          {workers.calendar && <AmbientPulse label="Calendar" lastSyncAt={workers.calendar.lastSync} status={workers.calendar.status} />}
          {workers.google_drive && <AmbientPulse label="Drive" lastSyncAt={workers.google_drive.lastSync} status={workers.google_drive.status} />}
          {workers.vercel && <AmbientPulse label="Vercel" lastSyncAt={workers.vercel.lastSync} status={workers.vercel.status} />}
          {workers.finance && <AmbientPulse label="Xero" lastSyncAt={workers.finance.lastSync} status={workers.finance.status} />}
          {workers.linkedin && <AmbientPulse label="LinkedIn" lastSyncAt={workers.linkedin.lastSync} status={workers.linkedin.status} />}
          {workers.meta && <AmbientPulse label="Meta" lastSyncAt={workers.meta.lastSync} status={workers.meta.status} />}
        </div>
      </SpatialLayer>

      {/* KPI cards — content plane, slightly forward */}
      <SpatialLayer z={10}>
        <KPICards />
      </SpatialLayer>

      {/* Activity feed — recessed, sits behind the KPIs */}
      <SpatialLayer z={-10} className="mt-16 sm:mt-20 md:ml-auto md:max-w-xl lg:max-w-2xl">
        <ActivityFeed />
      </SpatialLayer>
    </div>
  )
}
