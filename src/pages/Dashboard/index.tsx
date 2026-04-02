import { KPICards } from './KPICards'
import { ActionStream } from './ActionStream'
import { TaskStream } from './TaskStream'
import { AmbientPulse } from '@/components/spatial/AmbientPulse'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { useWorkerStatus } from '@/hooks/useWorkerStatus'
import type { WorkerStatus } from '@/store/workerStore'

export default function DashboardPage() {
  const workers = useWorkerStatus() as Record<string, WorkerStatus>

  return (
    <div className="mx-auto max-w-5xl">
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

      {/* Two-column layout: Actions + Tasks */}
      <div className="mt-12 grid gap-12 sm:mt-16 lg:grid-cols-2 lg:gap-10">
        {/* Action stream — pre-processed items ready for one-tap approval */}
        <SpatialLayer z={15}>
          <ActionStream />
        </SpatialLayer>

        {/* Task stream — active intentions */}
        <SpatialLayer z={-5}>
          <TaskStream />
        </SpatialLayer>
      </div>
    </div>
  )
}
