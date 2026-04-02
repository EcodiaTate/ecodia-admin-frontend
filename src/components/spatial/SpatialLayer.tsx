import { motion, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSpatialContext } from './SpatialDepthProvider'

interface SpatialLayerProps {
  /** Z-depth in pixels. Positive = closer, negative = further. */
  z: number
  className?: string
  children: React.ReactNode
  as?: 'div' | 'section' | 'header' | 'footer' | 'aside' | 'main'
}

/** Lateral shift per unit of Z per unit of tilt — cranked for visible separation */
const PARALLAX_INTENSITY = 0.7

export function SpatialLayer({ z, className, children, as = 'div' }: SpatialLayerProps) {
  const { tiltX, tiltY } = useSpatialContext()

  // At z=30, full tilt → 21px shift. At z=-20 → -14px shift. Clearly visible.
  const x = useTransform(tiltX, (v) => v * z * PARALLAX_INTENSITY)
  const y = useTransform(tiltY, (v) => v * z * PARALLAX_INTENSITY)

  const Component = motion[as]

  return (
    <Component
      className={cn('will-change-transform', className)}
      style={{
        x,
        y,
        translateZ: z,
      }}
    >
      {children}
    </Component>
  )
}
