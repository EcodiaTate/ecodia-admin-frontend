import { useQuery } from '@tanstack/react-query'
import { getPipeline } from '@/api/crm'
import { ClientCard } from './ClientCard'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { Client, PipelineStage } from '@/types/crm'

const STAGE_LABELS: Record<PipelineStage, string> = {
  lead: 'Lead',
  proposal: 'Proposal',
  contract: 'Contract',
  development: 'Development',
  live: 'Live',
  ongoing: 'Ongoing',
  archived: 'Archived',
}

interface PipelineProps {
  onSelectClient: (client: Client) => void
}

export function Pipeline({ onSelectClient }: PipelineProps) {
  const { data, isLoading } = useQuery({ queryKey: ['pipeline'], queryFn: getPipeline })

  if (isLoading) return <LoadingSpinner />

  const stages = Object.keys(STAGE_LABELS) as PipelineStage[]

  return (
    <div className="flex gap-5 overflow-x-auto pb-6">
      {stages.filter(s => s !== 'archived').map((stage) => (
        <div key={stage} className="min-w-[240px] flex-shrink-0">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">{STAGE_LABELS[stage]}</h3>
            <span className="font-mono text-label-sm text-on-surface-muted">{data?.[stage]?.length ?? 0}</span>
          </div>
          <div className="space-y-3">
            {data?.[stage]?.map((client) => (
              <ClientCard key={client.id} client={client} onClick={() => onSelectClient(client)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
