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
  Brain,
} from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'

const links = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Atmospheric Vitals' },
  { to: '/finance', icon: DollarSign, label: 'Financial Ecosystem' },
  { to: '/gmail', icon: Mail, label: 'Digital Curator' },
  { to: '/linkedin', icon: Linkedin, label: 'Network Intelligence' },
  { to: '/crm', icon: Users, label: 'Flow State' },
  { to: '/cortex', icon: Brain, label: 'The Cortex' },
  { to: '/claude-code', icon: Terminal, label: 'Autonomy Core' },
  { to: '/settings', icon: Settings, label: 'System Nodes' },
]

export function Sidebar() {
  return (
    <Tooltip.Provider delayDuration={200}>
      <aside className="relative z-20 flex h-screen w-16 flex-col items-center bg-surface-container-low/60 backdrop-blur-glass py-6">
        {/* Wordmark */}
        <div className="mb-10 flex flex-col items-center">
          <span className="text-label-sm font-display font-medium uppercase tracking-[0.2em] text-on-surface-muted">
            E O S
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col items-center gap-3">
          {links.map(({ to, icon: Icon, label }) => (
            <Tooltip.Root key={to}>
              <Tooltip.Trigger asChild>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-glass'
                        : 'text-on-surface-muted hover:bg-surface-container hover:text-on-surface-variant',
                    )
                  }
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                </NavLink>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={12}
                  className="glass-elevated rounded-xl px-3 py-1.5 text-xs font-medium text-on-surface-variant"
                >
                  {label}
                  <Tooltip.Arrow className="fill-white/60" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          ))}
        </nav>
      </aside>
    </Tooltip.Provider>
  )
}
