import { useWebSocket } from '@/hooks/useWebSocket'
import { AuroraBackground } from '@/components/spatial/AuroraBackground'
import { AmbientParticles } from '@/components/spatial/AmbientParticles'
import { SpatialCanvas } from '@/components/spatial/SpatialCanvas'
import { FloatingNav } from '@/components/spatial/FloatingNav'
import { AmbientStatus } from '@/components/spatial/AmbientStatus'

export function AppShell() {
  useWebSocket()

  return (
    <div className="h-screen w-screen overflow-hidden bg-surface">
      {/* Layer 0: Reactive aurora */}
      <AuroraBackground />


      {/* Layer 1.5: Ambient particles */}
      <AmbientParticles />

      {/* Layer 2: Scene content with spatial transitions */}
      <SpatialCanvas />

      {/* Layer 3: Floating navigation */}
      <FloatingNav />

      {/* Layer 4: Ambient status indicators */}
      <AmbientStatus />
    </div>
  )
}
