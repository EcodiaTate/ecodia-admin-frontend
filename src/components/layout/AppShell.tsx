import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useWebSocket } from '@/hooks/useWebSocket'

export function AppShell() {
  useWebSocket()

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
