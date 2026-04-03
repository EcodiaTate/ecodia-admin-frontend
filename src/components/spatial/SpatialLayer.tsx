import { motion, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useSpatialContext } from './SpatialDepthProvider'

interface SpatialLayerProps {
  /** Z-depth value. Positive = closer (moves more), negative = further (moves opposite). */
  z: number
  className?: string
  children: React.ReactNode
  as?: 'div' | 'section' | 'header' | 'footer' | 'aside' | 'main'
}

/** Lateral shift per unit of Z per unit of tilt */
const PARALLAX_INTENSITY = 0.7

export function SpatialLayer({ z, className, children, as = 'div' }: SpatialLayerProps) {
  const { tiltX, tiltY } = useSpatialContext()

  // Parallax via lateral translation - no preserve-3d chain required.
  // Elements at z=30 shift 21px at full tilt. Elements at z=-10 shift -7px (opposite).
  const x = useTransform(tiltX, (v) => v * z * PARALLAX_INTENSITY)
  const y = useTransform(tiltY, (v) => v * z * PARALLAX_INTENSITY)

  const Component = motion[as]

  return (
    <Component
      className={cn(className)}
      style={{ x, y }}
    >
      {children}
    </Component>
  )
}
