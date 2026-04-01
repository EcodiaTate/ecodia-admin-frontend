import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useWebSocket } from '@/hooks/useWebSocket'

export function AppShell() {
  useWebSocket()

  return (
    <div className="aurora-canvas flex h-screen overflow-hidden bg-surface">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="relative z-10 flex-1 overflow-y-auto px-10 py-8 lg:px-16 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
