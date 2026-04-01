import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/api/crm'
import { Pipeline } from './Pipeline'
import { ProjectDetail } from './ProjectDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Client } from '@/types/crm'

export default function CRMPage() {
  const { clientId } = useParams()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const activeId = clientId || selectedClient?.id
  const { data: client } = useQuery({
    queryKey: ['client', activeId],
    queryFn: () => getClient(activeId!),
    enabled: !!activeId,
  })

  if (client) {
    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedClient(null)} className="text-sm text-zinc-400 hover:text-zinc-200">
          &larr; Back to pipeline
        </button>
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-semibold text-zinc-100">{client.name}</h1>
              {client.company && <p className="text-sm text-zinc-400">{client.company}</p>}
            </div>
            <div className="flex gap-2">
              <StatusBadge status={client.stage} />
              <StatusBadge status={client.priority} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            {client.email && <div><span className="text-zinc-500">Email:</span> <span className="text-zinc-300">{client.email}</span></div>}
            {client.phone && <div><span className="text-zinc-500">Phone:</span> <span className="text-zinc-300">{client.phone}</span></div>}
          </div>

          {client.notes.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="text-sm font-medium text-zinc-400">Notes</h3>
              {client.notes.map((n, i) => (
                <div key={i} className="rounded-md bg-zinc-800/50 p-3">
                  <p className="text-sm text-zinc-300">{n.content}</p>
                  <p className="mt-1 text-xs text-zinc-500">{n.source} &middot; {new Date(n.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <ProjectDetail clientId={client.id} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-zinc-100">CRM Pipeline</h1>
      <Pipeline onSelectClient={setSelectedClient} />
    </div>
  )
}
