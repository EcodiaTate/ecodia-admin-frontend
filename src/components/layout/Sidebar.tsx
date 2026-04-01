import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  DollarSign,
  Mail,
  Linkedin,
  Users,
  Terminal,
  Settings,
} from 'lucide-react'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/finance', icon: DollarSign, label: 'Finance' },
  { to: '/gmail', icon: Mail, label: 'Gmail' },
  { to: '/linkedin', icon: Linkedin, label: 'LinkedIn' },
  { to: '/crm', icon: Users, label: 'CRM' },
  { to: '/claude-code', icon: Terminal, label: 'Claude Code' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export function Sidebar() {
  return (
    <aside className="flex h-screen w-56 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-14 items-center px-4">
        <span className="text-lg font-semibold text-zinc-100">Ecodia</span>
      </div>
      <nav className="flex-1 space-y-1 px-2 py-4">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
