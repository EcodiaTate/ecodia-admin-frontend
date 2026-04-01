import { useQuery } from '@tanstack/react-query'
import { getClientProjects } from '@/api/crm'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency } from '@/lib/utils'
import type { Project } from '@/types/crm'

export function ProjectDetail({ clientId }: { clientId: string }) {
  const { data: projects } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => getClientProjects(clientId),
  })

  return (
    <div className="space-y-4">
      <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Projects</h3>
      {projects?.map((p: Project) => (
        <div key={p.id} className="glass rounded-2xl p-6">
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
        </div>
      ))}
      {(!projects || projects.length === 0) && (
        <p className="py-12 text-center text-sm text-on-surface-muted">No projects</p>
      )}
    </div>
  )
}
