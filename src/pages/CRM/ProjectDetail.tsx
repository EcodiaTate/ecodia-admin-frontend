import { useQuery } from '@tanstack/react-query'
import { getClientProjects } from '@/api/crm'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import type { Project } from '@/types/crm'
import { DollarSign, Calendar, Clock, FileText } from 'lucide-react'

const PAYMENT_COLOR: Record<string, string> = {
  none: 'text-on-surface-muted/30',
  invoiced: 'text-amber-500',
  partial: 'text-amber-600',
  paid: 'text-green-600',
  overdue: 'text-red-500',
}

export function ProjectDetail({ clientId }: { clientId: string }) {
  const { data: projects } = useQuery({
    queryKey: ['clientProjects', clientId],
    queryFn: () => getClientProjects(clientId),
  })

  if (!projects || projects.length === 0) return null

  return (
    <div className="space-y-4">
      <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Projects</h3>
      {projects.map((p: Project, i: number) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.06 }}
        >
          <GlassPanel depth="surface" holo className="p-6">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-medium text-on-surface">{p.name}</p>
              <div className="flex items-center gap-2">
                {p.payment_status && p.payment_status !== 'none' && (
                  <span className={`text-[10px] font-mono uppercase tracking-wider ${PAYMENT_COLOR[p.payment_status] || ''}`}>
                    {p.payment_status}
                  </span>
                )}
                <StatusBadge status={p.status} />
              </div>
            </div>
            {p.description && <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">{p.description}</p>}

            <div className="mt-3 flex flex-wrap gap-4 text-label-sm font-mono text-on-surface-muted">
              {p.tech_stack?.length > 0 && <span>{p.tech_stack.join(', ')}</span>}
              {p.deal_value_aud != null && (
                <span className="flex items-center gap-1 text-green-600">
                  <DollarSign className="w-3 h-3" />{formatCurrency(p.deal_value_aud)}
                </span>
              )}
              {!p.deal_value_aud && p.budget_aud != null && (
                <span>Budget: {formatCurrency(p.budget_aud)}</span>
              )}
              {p.hourly_rate != null && <span>Rate: {formatCurrency(p.hourly_rate)}/hr</span>}
              {p.contract_date && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />Contract: {new Date(p.contract_date).toLocaleDateString()}
                </span>
              )}
              {p.estimated_hours != null && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{p.actual_hours_logged || 0}/{p.estimated_hours}h
                </span>
              )}
              {p.invoice_ref && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />Inv: {p.invoice_ref}
                </span>
              )}
            </div>

            {p.repo_url && (
              <a href={p.repo_url} target="_blank" rel="noopener noreferrer"
                className="mt-2 block text-[11px] text-primary/60 hover:text-primary truncate">{p.repo_url}</a>
            )}
          </GlassPanel>
        </motion.div>
      ))}
    </div>
  )
}
