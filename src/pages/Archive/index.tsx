import { useQuery } from '@tanstack/react-query'
import { getKGStats } from '@/api/knowledgeGraph'
import { getClients } from '@/api/crm'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { SpatialLayer } from '@/components/spatial/SpatialLayer'
import { GlassPanel } from '@/components/spatial/GlassPanel'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { motion } from 'framer-motion'
import { BookOpen, Users, Network } from 'lucide-react'
import { formatRelative } from '@/lib/utils'

export default function ArchivePage() {
  const { data: stats } = useQuery({
    queryKey: ['kgStats'],
    queryFn: getKGStats,
  })

  const { data: clientData, isLoading } = useQuery({
    queryKey: ['archivedClients'],
    queryFn: () => getClients({ limit: 50 }),
  })

  const clients = clientData?.clients ?? []
  const archivedClients = clients.filter(c => c.stage === 'archived')

  return (
    <div className="mx-auto max-w-4xl">
      <SpatialLayer z={25} className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-label-md font-display uppercase tracking-[0.2em] text-on-surface-muted">
            Institutional Memory
          </span>
          <h1 className="mt-3 font-display text-2xl font-light text-on-surface sm:text-display-md">
            The <em className="not-italic font-normal text-primary">Archive</em>
          </h1>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-6 sm:pt-2">
          {stats && (
            <>
              <WhisperStat label="Knowledge Nodes" value={stats.totalNodes.toLocaleString()} icon={Network} accent="text-primary" />
              <WhisperStat label="Relationships" value={stats.totalRelationships.toLocaleString()} accent="text-secondary" />
            </>
          )}
        </div>
      </SpatialLayer>

      {/* Label distribution */}
      {stats && stats.labelBreakdown.length > 0 && (
        <SpatialLayer z={10} className="mb-14">
          <h3 className="mb-6 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
            Knowledge Distribution
          </h3>
          <div className="flex flex-wrap gap-3">
            {stats.labelBreakdown.map((lb, i) => (
              <motion.div
                key={lb.label}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.04 }}
                className="rounded-2xl bg-white/40 px-5 py-3 hover:bg-white/55"
              >
                <p className="text-sm font-medium text-on-surface">{lb.label}</p>
                <p className="font-mono text-label-sm text-on-surface-muted">{lb.count} nodes</p>
              </motion.div>
            ))}
          </div>
        </SpatialLayer>
      )}

      {/* Archived Clients */}
      <SpatialLayer z={-5}>
        <h3 className="mb-6 flex items-center gap-2 text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
          <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
          Archived Relationships
        </h3>

        {isLoading ? (
          <LoadingSpinner />
        ) : archivedClients.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {archivedClients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 100, damping: 22, delay: i * 0.05 }}
              >
                <GlassPanel depth="surface" className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display text-sm font-medium text-on-surface">{client.name}</p>
                      {client.company && <p className="mt-0.5 text-xs text-on-surface-muted">{client.company}</p>}
                    </div>
                    <BookOpen className="h-4 w-4 text-on-surface-muted/30" strokeWidth={1.5} />
                  </div>
                  {client.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {client.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted">{tag}</span>
                      ))}
                    </div>
                  )}
                  <p className="mt-3 font-mono text-label-sm text-on-surface-muted/40">
                    Archived {formatRelative(client.updated_at)}
                  </p>
                </GlassPanel>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center">
            <BookOpen className="mx-auto h-6 w-6 text-on-surface-muted/20" strokeWidth={1.5} />
            <p className="mt-4 text-sm text-on-surface-muted/40">
              The archive grows with each completed engagement.
            </p>
          </div>
        )}
      </SpatialLayer>
    </div>
  )
}
