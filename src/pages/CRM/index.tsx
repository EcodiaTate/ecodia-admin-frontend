import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getClient, getPipeline } from '@/api/crm'
import { ProjectDetail } from './ProjectDetail'
import { StatusBadge } from '@/components/shared/StatusBadge'
import type { Client, PipelineStage } from '@/types/crm'
import { motion, AnimatePresence } from 'framer-motion'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { ArrowLeft } from 'lucide-react'
import { formatRelative } from '@/lib/utils'

// ─── Stage ordering and visual weight ─────────────────────────────────
// Clients float in a field, grouped loosely by momentum.
// No columns. No kanban. Just proximity and weight.

const STAGE_MOMENTUM: Record<PipelineStage, number> = {
  lead: 0.2,
  proposal: 0.4,
  contract: 0.6,
  development: 0.8,
  live: 1.0,
  ongoing: 0.9,
  archived: 0.0,
}

const STAGE_COLOR: Record<PipelineStage, string> = {
  lead: 'text-on-surface-muted/50',
  proposal: 'text-tertiary/60',
  contract: 'text-gold/70',
  development: 'text-primary/80',
  live: 'text-secondary',
  ongoing: 'text-secondary/70',
  archived: 'text-on-surface-muted/20',
}

export default function CRMPage() {
  const { clientId } = useParams()
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  const activeId = clientId || selectedClient?.id
  const { data: client } = useQuery({
    queryKey: ['client', activeId],
    queryFn: () => getClient(activeId!),
    enabled: !!activeId,
  })

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline'],
    queryFn: getPipeline,
  })

  // Flatten all clients, sorted by momentum (most active first), excluding archived
  const allClients = pipeline
    ? (Object.entries(pipeline) as [PipelineStage, Client[]][])
        .filter(([stage]) => stage !== 'archived')
        .flatMap(([, clients]) => clients)
        .sort((a, b) => (STAGE_MOMENTUM[b.stage] ?? 0) - (STAGE_MOMENTUM[a.stage] ?? 0))
    : []

  const liveCount = allClients.filter(c => c.stage === 'live' || c.stage === 'ongoing').length
  const inMotionCount = allClients.filter(c =>
    c.stage === 'development' || c.stage === 'contract' || c.stage === 'proposal'
  ).length

  return (
    <div className="mx-auto max-w-5xl">
      <SpatialLayer z={25} className="mb-14">
        <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted/60">
          Relational Field
        </span>
        <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
          Flow <em className="not-italic font-normal text-primary">State</em>
        </h1>

        {/* Ambient signal — what the field looks like right now */}
        {allClients.length > 0 && (
          <div className="mt-6 flex items-center gap-8 text-on-surface-muted/40">
            <span className="font-mono text-label-sm">
              <span className="text-secondary">{liveCount}</span> live
            </span>
            <span className="font-mono text-label-sm">
              <span className="text-tertiary">{inMotionCount}</span> in motion
            </span>
            <span className="font-mono text-label-sm">
              <span className="text-on-surface-variant">{allClients.length}</span> total
            </span>
          </div>
        )}
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
              className="max-w-3xl space-y-8"
            >
              <button
                onClick={() => setSelectedClient(null)}
                className="flex items-center gap-2 text-sm text-on-surface-muted transition-colors hover:text-on-surface-variant"
              >
                <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} /> Back
              </button>

              <ClientDetail client={client} />
              <ProjectDetail clientId={client.id} />
            </motion.div>
          ) : (
            <motion.div
              key="field"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 22 }}
            >
              <RelationalField clients={allClients} onSelect={setSelectedClient} />
            </motion.div>
          )}
        </AnimatePresence>
      </SpatialLayer>
    </div>
  )
}

// ─── Relational Field — clients as floating nodes, not rows ──────────
// Momentum determines visual prominence. Live clients breathe loudest.
// Archived clients don't exist here.

function RelationalField({ clients, onSelect }: { clients: Client[]; onSelect: (c: Client) => void }) {
  if (clients.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-on-surface-muted/30">
          The field is quiet. Cortex will surface leads as they emerge.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client, i) => {
        const momentum = STAGE_MOMENTUM[client.stage] ?? 0
        const opacity = 0.3 + momentum * 0.7

        return (
          <motion.button
            key={client.id}
            onClick={() => onSelect(client)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity, y: 0 }}
            whileHover={{ opacity: 1, y: -2, transition: { type: 'spring', stiffness: 200, damping: 20 } }}
            transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.03 }}
            className="group rounded-2xl bg-white/40 p-5 text-left hover:bg-white/60"
            style={{ opacity }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-sm font-medium text-on-surface truncate">{client.name}</p>
                {client.company && (
                  <p className="mt-0.5 text-xs text-on-surface-muted truncate">{client.company}</p>
                )}
              </div>
              {/* Stage as a living signal, not a badge */}
              <span className={`shrink-0 font-mono text-[10px] uppercase tracking-wider ${STAGE_COLOR[client.stage]}`}>
                {client.stage}
              </span>
            </div>

            {client.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {client.tags.map(tag => (
                  <span key={tag} className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted/50">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Last activity whisper */}
            <p className="mt-3 font-mono text-[10px] text-on-surface-muted/25 opacity-0 transition-opacity group-hover:opacity-100">
              {formatRelative(client.updated_at)}
            </p>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Client Detail — observation only ────────────────────────────────

function ClientDetail({ client }: { client: Client }) {
  const momentum = STAGE_MOMENTUM[client.stage] ?? 0

  return (
    <GlassPanel depth="elevated" className="p-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="font-display text-display-md font-light text-on-surface">{client.name}</h1>
          {client.company && (
            <p className="mt-2 text-sm text-on-surface-muted">{client.company}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`font-mono text-sm uppercase tracking-wider ${STAGE_COLOR[client.stage]}`}>
            {client.stage}
          </span>
          <StatusBadge status={client.priority} />
        </div>
      </div>

      {/* Momentum bar — visual pulse of where this client is in the journey */}
      <div className="mt-6 h-px w-full bg-on-surface-muted/8">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${momentum * 100}%` }}
          transition={{ type: 'spring', stiffness: 60, damping: 20, delay: 0.2 }}
          className="h-px bg-secondary/40"
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 text-sm">
        {client.email && (
          <div>
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">Email</span>
            <p className="mt-1 text-on-surface-variant">{client.email}</p>
          </div>
        )}
        {client.phone && (
          <div>
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">Phone</span>
            <p className="mt-1 text-on-surface-variant">{client.phone}</p>
          </div>
        )}
        {client.linkedin_url && (
          <div className="col-span-2">
            <span className="text-label-sm uppercase tracking-[0.05em] text-on-surface-muted/50">LinkedIn</span>
            <a
              href={client.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-sm text-primary/70 hover:text-primary"
            >
              {client.linkedin_url}
            </a>
          </div>
        )}
      </div>

      {/* Notes — what the system has observed */}
      {client.notes.length > 0 && (
        <div className="mt-10 space-y-3">
          <h3 className="text-label-sm uppercase tracking-[0.1em] text-on-surface-muted/40">
            Signal Log
          </h3>
          {client.notes.map((n, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-surface-container-low/60 p-5"
            >
              <p className="text-sm leading-relaxed text-on-surface-variant">{n.content}</p>
              <p className="mt-2 font-mono text-[10px] text-on-surface-muted/30">
                {n.source} · {new Date(n.createdAt).toLocaleDateString()}
              </p>
            </motion.div>
          ))}
        </div>
      )}
    </GlassPanel>
  )
}
