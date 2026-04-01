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
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-400">Projects</h3>
      {projects?.map((p: Project) => (
        <div key={p.id} className="rounded-md border border-zinc-800 bg-zinc-900/50 p-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-zinc-200">{p.name}</p>
            <StatusBadge status={p.status} />
          </div>
          {p.description && <p className="mt-1 text-sm text-zinc-400">{p.description}</p>}
          <div className="mt-2 flex gap-4 text-xs text-zinc-500">
            {p.tech_stack.length > 0 && <span>{p.tech_stack.join(', ')}</span>}
            {p.budget_aud && <span>Budget: {formatCurrency(p.budget_aud)}</span>}
            {p.hourly_rate && <span>Rate: {formatCurrency(p.hourly_rate)}/hr</span>}
          </div>
        </div>
      ))}
      {(!projects || projects.length === 0) && (
        <p className="text-sm text-zinc-500">No projects</p>
      )}
    </div>
  )
}
