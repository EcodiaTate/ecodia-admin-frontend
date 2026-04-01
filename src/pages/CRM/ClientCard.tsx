import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Client } from '@/types/crm'

interface ClientCardProps {
  client: Client
  onClick: () => void
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-md border border-zinc-800 bg-zinc-900/50 p-3 transition-colors hover:bg-zinc-800/50"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-zinc-200">{client.name}</p>
          {client.company && <p className="text-xs text-zinc-500">{client.company}</p>}
        </div>
        <StatusBadge status={client.priority} />
      </div>
      {client.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {client.tags.map((tag) => (
            <span key={tag} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400">
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
