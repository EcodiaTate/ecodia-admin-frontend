import { useQuery } from '@tanstack/react-query'
import { getClientProjects } from '@/api/crm'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Project } from '@/types/crm'

export function ProjectDetail({ clientId }: { clientId: string }) {
  const { data: projects } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => getClientProjects(clientId),
  })

  return (
    <div className="space-y-4">
      <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Projects</h3>
      {projects?.map((p: Project, i: number) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.06 }}
        >
          <GlassPanel depth="surface" holo className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-medium text-on-surface">{p.name}</p>
              <StatusBadge status={p.status} />
            </div>
            {p.description && <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">{p.description}</p>}
            <div className="mt-3 flex gap-4 font-mono text-label-sm text-on-surface-muted">
              {p.tech_stack.length > 0 && <span>{p.tech_stack.join(', ')}</span>}
              {p.budget_aud && <span>Budget: {formatCurrency(p.budget_aud)}</span>}
              {p.hourly_rate && <span>Rate: {formatCurrency(p.hourly_rate)}/hr</span>}
            </div>
          </GlassPanel>
        </motion.div>
      ))}
      {(!projects || projects.length === 0) && (
        <p className="py-12 text-center text-sm text-on-surface-muted">No projects</p>
      )}
    </div>
  )
}
