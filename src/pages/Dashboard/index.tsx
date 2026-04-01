import { KPICards } from './KPICards'
import { ActivityFeed } from './ActivityFeed'

export default function DashboardPage() {
  return (
    <div className="max-w-5xl">
      <div className="mb-16">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
          Ecosystem Overview
        </span>
        <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
          Atmospheric <em className="not-italic font-normal text-primary">Vitals</em>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-on-surface-muted">
          Ambient monitoring of financial health, communication streams, and network state across the Ecodia ecosystem.
        </p>
      </div>

      <KPICards />

      <div className="mt-16">
        <ActivityFeed />
      </div>
    </div>
  )
}
