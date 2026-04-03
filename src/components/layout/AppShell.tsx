import { useWebSocket } from '@/hooks/useWebSocket'
import { MetabolicProvider } from '@/components/spatial/MetabolicProvider'
import { SpatialDepthProvider } from '@/components/spatial/SpatialDepthProvider'
import { AuroraBackground } from '@/components/spatial/AuroraBackground'
import { SpatialEdgeLight } from '@/components/spatial/SpatialEdgeLight'
import { AmbientParticles } from '@/components/spatial/AmbientParticles'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { FloatingNav } from '@/components/spatial/FloatingNav'
import { AmbientStatus } from '@/components/spatial/AmbientStatus'
import { EcosystemStatusBar } from '@/components/spatial/EcosystemStatusBar'

export function AppShell() {
  useWebSocket()

  return (
    <MetabolicProvider>
      <SpatialDepthProvider>
        <div className="h-screen w-screen overflow-hidden bg-surface">
          {/* Layer 0: Reactive aurora - deepest background */}
          <AuroraBackground />

          {/* Layer 0.5: Directional light glare - follows tilt */}
          <SpatialEdgeLight />

          {/* Layer 1.5: Ambient particles - scattered at various depths */}
          <AmbientParticles />

          {/* Layer 2: Scene content with spatial transitions + gyro perspective */}
          <SpatialCanvas />

          {/* Layer 3: Floating navigation - own parallax layer */}
          <FloatingNav />

          {/* Layer 4: Ambient status indicators */}
          <AmbientStatus />

          {/* Layer 5: Persistent ecosystem status bar - bottom edge */}
          <EcosystemStatusBar />
        </div>
      </SpatialDepthProvider>
    </MetabolicProvider>
  )
}
