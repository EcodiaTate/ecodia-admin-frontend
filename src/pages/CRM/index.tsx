import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getClient } from '@/api/crm'
import { Pipeline } from './Pipeline'
import { ProjectDetail } from './ProjectDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'

import type { Client } from '@/types/crm'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
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

  return (
    <div className="mx-auto max-w-6xl">
      <SpatialLayer z={25} className="mb-10 sm:mb-12">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Client Network
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          Flow <em className="not-italic font-normal text-primary">State</em>
        </h1>
      </SpatialLayer>

      <SpatialLayer z={-5}>
      <AnimatePresence mode="popLayout" initial={false}>
        {client ? (
          <motion.div
            key="client-detail"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            className="max-w-4xl space-y-8"
          >
            <button
              onClick={() => setSelectedClient(null)}
              className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
            >
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back to pipeline
            </button>

            <div className="rounded-3xl bg-white/40 p-10">
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

              <AnimatePresence>
                {client.notes.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-10 space-y-3"
                  >
                    <h3 className="text-label-md uppercase tracking-[0.05em] text-on-surface-muted">Notes</h3>
                    {client.notes.map((n, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl bg-surface-container-low p-5"
                      >
                        <p className="text-sm leading-relaxed text-on-surface-variant">{n.content}</p>
                        <p className="mt-2 font-mono text-label-sm text-on-surface-muted">
                          {n.source} &middot; {new Date(n.createdAt).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ProjectDetail clientId={client.id} />
          </motion.div>
        ) : (
          <motion.div
            key="pipeline"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          >
            <Pipeline onSelectClient={setSelectedClient} />
          </motion.div>
        )}
      </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}
