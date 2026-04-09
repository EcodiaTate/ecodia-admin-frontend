import { useWebSocket } from '@/hooks/useWebSocket'
import { MetabolicProvider } from '@/components/spatial/MetabolicProvider'
import { SpatialDepthProvider } from '@/components/spatial/SpatialDepthProvider'
import { AuroraBackground } from '@/components/spatial/AuroraBackground'
import { SpatialEdgeLight } from '@/components/spatial/SpatialEdgeLight'
import { AmbientParticles } from '@/components/spatial/AmbientParticles'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { GlobalConstellation } from '@/components/spatial/GlobalConstellation'
import { HomecomingOverlay } from '@/components/spatial/HomecomingOverlay'

export function AppShell() {
  useWebSocket()

  return (
    <MetabolicProvider>
      <SpatialDepthProvider>
        <div className="h-screen w-screen overflow-hidden bg-surface">
          <AuroraBackground />
          <GlobalConstellation />
          <SpatialEdgeLight />
          <AmbientParticles />
          <SpatialCanvas />
          <HomecomingOverlay />
        </div>
      </SpatialDepthProvider>
    </MetabolicProvider>
  )
}
