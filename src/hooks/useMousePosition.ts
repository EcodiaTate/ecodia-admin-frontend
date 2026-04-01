import { useEffect } from 'react'
import { useMotionValue } from 'framer-motion'

/**
 * Tracks mouse position using MotionValues — zero re-renders.
 * Use with useTransform() for derived values.
 */
export function useMousePosition() {
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('mousemove', handler, { passive: true })
    return () => window.removeEventListener('mousemove', handler)
  }, [x, y])

  return { mouseX: x, mouseY: y }
}
