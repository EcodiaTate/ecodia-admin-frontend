import { KPICards } from './KPICards'
import { ActivityFeed } from './ActivityFeed'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">Dashboard</h1>
      <KPICards />
      <ActivityFeed />
    </div>
  )
}
