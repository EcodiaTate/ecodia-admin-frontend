import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/api/crm'
import { Pipeline } from './Pipeline'
import { ProjectDetail } from './ProjectDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Client } from '@/types/crm'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'

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
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="max-w-4xl space-y-8"
      >
        <button
          onClick={() => setSelectedClient(null)}
          className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to pipeline
        </button>

        <div className="glass rounded-3xl p-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-display-md font-light text-on-surface">{client.name}</h1>
              {client.company && <p className="mt-2 text-sm text-on-surface-muted">{client.company}</p>}
            </div>
            <div className="flex gap-2">
              <StatusBadge status={client.stage} />
              <StatusBadge status={client.priority} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
            {client.email && (
              <div>
                <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Email</span>
                <p className="mt-1 text-on-surface-variant">{client.email}</p>
              </div>
            )}
            {client.phone && (
              <div>
                <span className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Phone</span>
                <p className="mt-1 text-on-surface-variant">{client.phone}</p>
              </div>
            )}
          </div>

          {client.notes.length > 0 && (
            <div className="mt-10 space-y-3">
              <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Notes</h3>
              {client.notes.map((n, i) => (
                <div key={i} className="rounded-2xl bg-surface-container-low p-5">
                  <p className="text-sm leading-relaxed text-on-surface-variant">{n.content}</p>
                  <p className="mt-2 font-mono text-label-sm text-on-surface-muted">
                    {n.source} &middot; {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <ProjectDetail clientId={client.id} />
      </motion.div>
    )
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-12">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
          Client Network
        </span>
        <h1 className="mt-3 font-display text-display-md font-light text-on-surface">
          Flow <em className="not-italic font-normal text-primary">State</em>
        </h1>
      </div>
      <Pipeline onSelectClient={setSelectedClient} />
    </div>
  )
}
