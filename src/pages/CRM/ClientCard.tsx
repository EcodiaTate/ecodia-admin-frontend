import { StatusBadge } from '@/components/shared/StatusBadge'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import type { Client } from '@/types/crm'

interface ClientCardProps {
  client: Client
  onClick: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  return (
    <GlassPanel depth="elevated" parallax holo onClick={onClick} className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-display text-sm font-medium text-on-surface">{client.name}</p>
          {client.company && <p className="mt-0.5 text-xs text-on-surface-muted">{client.company}</p>}
        </div>
        <StatusBadge status={client.priority} />
      </div>
      {client.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {client.tags.map((tag) => (
            <span key={tag} className="rounded-lg bg-surface-container px-2 py-0.5 text-label-sm text-on-surface-muted">
              {tag}
            </span>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}
