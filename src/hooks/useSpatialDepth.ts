import { useEffect, useRef, useCallback } from 'react'
import { useMotionValue, useSpring } from 'framer-motion'
import { useMetabolicSpringConfig } from './useMetabolicSpringConfig'

/**
 * Unified spatial depth engine — gyroscope on mobile, mouse on desktop.
 *
 * Returns spring-smoothed tilt values (±1 range) that drive:
 *   - perspective-origin shifts on the spatial viewport
 *   - per-element translateZ parallax via SpatialLayer
 *   - GlassPanel ambient tilt
 *   - Aurora counter-drift
 *   - Particle scatter
 *   - Edge-light direction
 *
 * On mobile: DeviceOrientationEvent (beta/gamma → tilt)
 * On desktop: mouse position relative to viewport center
 *
 * Zero re-renders — all values are MotionValues.
 */

// Looser springs = more floaty, organic, holographic feel
// Higher damping + mass prevents micro-oscillations during fast mouse movements
const BASE_SPRING = { stiffness: 22, damping: 20, mass: 2.2 }

// Lerp factor for input smoothing — lower = smoother but more latent
const MOUSE_LERP = 0.15

function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v))
}

export function useSpatialDepth() {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  // Spring config tightens under metabolic pressure — scene responds faster
  const springConfig = useMetabolicSpringConfig(BASE_SPRING)
  const tiltX = useSpring(rawX, springConfig)
  const tiltY = useSpring(rawY, springConfig)

  const hasGyro = useRef(false)
  const gyroCalibrated = useRef(false)
  const baselineBeta = useRef(0)
  const baselineGamma = useRef(0)

  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return

      if (!gyroCalibrated.current) {
        baselineBeta.current = e.beta
        baselineGamma.current = e.gamma
        gyroCalibrated.current = true
        return
      }

      // Wider range on mobile — ±20° for full tilt (more responsive)
      const dx = clamp((e.gamma - baselineGamma.current) / 20)
      const dy = clamp((e.beta - baselineBeta.current) / 20)

      rawX.set(dx)
      rawY.set(dy)
    },
    [rawX, rawY],
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (hasGyro.current) return
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      // Lerp toward target instead of snapping — eliminates micro-jitter on fast sweeps
      const prevX = rawX.get()
      const prevY = rawY.get()
      rawX.set(clamp(prevX + (nx - prevX) * MOUSE_LERP))
      rawY.set(clamp(prevY + (ny - prevY) * MOUSE_LERP))
    },
    [rawX, rawY],
  )

  useEffect(() => {
    const tryGyro = async () => {
      const doe = DeviceOrientationEvent as unknown as {
        requestPermission?: () => Promise<string>
      }
      if (typeof doe.requestPermission === 'function') {
        try {
          const perm = await doe.requestPermission()
          if (perm !== 'granted') return false
        } catch {
          return false
        }
      }

      return new Promise<boolean>((resolve) => {
        let received = false
        const test = (e: DeviceOrientationEvent) => {
          if (e.beta != null && e.gamma != null) {
            received = true
            window.removeEventListener('deviceorientation', test)
            resolve(true)
          }
        }
        window.addEventListener('deviceorientation', test, { passive: true })
        setTimeout(() => {
          if (!received) {
            window.removeEventListener('deviceorientation', test)
            resolve(false)
          }
        }, 500)
      })
    }

    let cleanup = () => {}

    tryGyro().then((gyroAvailable) => {
      if (gyroAvailable) {
        hasGyro.current = true
        window.addEventListener('deviceorientation', handleOrientation, { passive: true })
        cleanup = () => window.removeEventListener('deviceorientation', handleOrientation)
      } else {
        hasGyro.current = false
        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        cleanup = () => window.removeEventListener('mousemove', handleMouseMove)
      }
    })

    return () => cleanup()
  }, [handleOrientation, handleMouseMove])

  return { tiltX, tiltY, hasGyroscope: hasGyro.current }
}
