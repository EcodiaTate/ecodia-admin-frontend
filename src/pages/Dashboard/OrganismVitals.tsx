import { useQuery } from '@tanstack/react-query'
import { getOrganismVitals } from '@/api/symbridge'
import { WhisperStat } from '@/components/spatial/WhisperStat'
import { motion } from 'framer-motion'
import { Heart, Wifi, WifiOff, Zap, Brain, Activity } from 'lucide-react'

export function OrganismVitals() {
  const { data: vitals } = useQuery({
    queryKey: ['organismVitals'],
    queryFn: getOrganismVitals,
    refetchInterval: 30000,
    retry: 1,
  })

  if (!vitals?.bridge) return null

  const bridge = vitals.bridge
  const bridgeLayers = [
    { name: 'Redis', status: bridge.redis ?? 'disconnected' },
    { name: 'Neo4j', status: bridge.neo4j ?? 'disconnected' },
    { name: 'HTTP', status: bridge.http ?? 'disconnected' },
  ]

  const activeLayers = bridgeLayers.filter(l => l.status === 'connected').length
  const organismAlive = vitals.organism?.status === 'alive'

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <span className="text-label-md font-display uppercase tracking-[0.15em] text-on-surface-muted">
          Organism Link
        </span>
        {/* Mutual heartbeat indicator */}
        <motion.div
          animate={organismAlive ? {
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
          } : {}}
          transition={organismAlive ? {
            duration: 2,
            repeat: Infinity,
            ease: [0.42, 0, 0.58, 1],
          } : {}}
        >
          <Heart
            className={`h-3.5 w-3.5 ${organismAlive ? 'text-secondary' : 'text-on-surface-muted/30'}`}
            strokeWidth={1.75}
            fill={organismAlive ? 'currentColor' : 'none'}
          />
        </motion.div>
      </div>

      {/* Bridge layers */}
      <div className="mb-5 flex items-center gap-3">
        {bridgeLayers.map((layer) => (
          <div key={layer.name} className="flex items-center gap-1.5">
            {layer.status === 'connected' ? (
              <Wifi className="h-3 w-3 text-secondary" strokeWidth={1.75} />
            ) : (
              <WifiOff className="h-3 w-3 text-on-surface-muted/30" strokeWidth={1.75} />
            )}
            <span className={`text-[10px] font-medium uppercase tracking-wider ${
              layer.status === 'connected' ? 'text-secondary' : 'text-on-surface-muted/30'
            }`}>
              {layer.name}
            </span>
          </div>
        ))}
        <span className="ml-auto rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-muted">
          {activeLayers}/3 layers
        </span>
      </div>

      {/* Vitals whispers */}
      <div className="flex flex-wrap gap-4">
        <WhisperStat
          label="Organism"
          value={vitals.organism?.status === 'alive' ? 'Alive' : vitals.organism?.status || 'Offline'}
          icon={Brain}
          accent={organismAlive ? 'text-secondary' : 'text-on-surface-muted'}
        />
        <WhisperStat
          label="Messages 24h"
          value={`${bridge.messagesSent24h ?? 0}↑ ${bridge.messagesReceived24h ?? 0}↓`}
          icon={Zap}
        />
        {vitals.ecodia && (
          <WhisperStat
            label="CC Sessions"
            value={vitals.ecodia.activeCCSessions ?? 0}
            icon={Activity}
            accent={vitals.ecodia?.activeCCSessions > 0 ? 'text-primary' : undefined}
          />
        )}
      </div>

      {/* Organism capabilities (if connected) */}
      {vitals.organism?.capabilities && vitals.organism.capabilities.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {vitals.organism.capabilities.map(cap => (
            <span key={cap} className="rounded-full bg-secondary/8 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary/70">
              {cap}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
