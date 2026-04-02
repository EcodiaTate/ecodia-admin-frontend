import { useEffect, useRef, useCallback } from 'react'
import { useMotionValue, useSpring, MotionValue } from 'framer-motion'

/**
 * Unified spatial depth engine — gyroscope on mobile, mouse on desktop.
 *
 * Returns spring-smoothed tilt values (±1 range) that drive:
 *   - perspective-origin shifts on the spatial viewport
 *   - per-element translateZ parallax via SpatialLayer
 *   - GlassPanel ambient tilt
 *
 * On mobile: DeviceOrientationEvent (beta/gamma → tilt)
 * On desktop: mouse position relative to viewport center
 *
 * Zero re-renders — all values are MotionValues.
 */

const SPRING_CONFIG = { stiffness: 40, damping: 20, mass: 1.5 }

/** Clamp value between -1 and 1 */
function clamp(v: number): number {
  return Math.max(-1, Math.min(1, v))
}

export interface SpatialDepthValues {
  /** Horizontal tilt: -1 (left) to 1 (right) */
  tiltX: MotionValue<number>
  /** Vertical tilt: -1 (up) to 1 (down) */
  tiltY: MotionValue<number>
  /** Whether gyroscope is active (mobile) */
  hasGyroscope: boolean
}

export function useSpatialDepth(): SpatialDepthValues {
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)

  const tiltX = useSpring(rawX, SPRING_CONFIG)
  const tiltY = useSpring(rawY, SPRING_CONFIG)

  const hasGyro = useRef(false)
  const gyroCalibrated = useRef(false)
  const baselineBeta = useRef(0)
  const baselineGamma = useRef(0)

  // ── Gyroscope (mobile) ──
  const handleOrientation = useCallback(
    (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return

      // Calibrate on first reading — treat current holding angle as "neutral"
      if (!gyroCalibrated.current) {
        baselineBeta.current = e.beta
        baselineGamma.current = e.gamma
        gyroCalibrated.current = true
        return
      }

      // Delta from baseline, normalized to ±1 over a ±25° range
      const dx = clamp((e.gamma - baselineGamma.current) / 25)
      const dy = clamp((e.beta - baselineBeta.current) / 25)

      rawX.set(dx)
      rawY.set(dy)
    },
    [rawX, rawY],
  )

  // ── Mouse fallback (desktop) ──
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (hasGyro.current) return
      // Map mouse position to -1..1 relative to viewport center
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      rawX.set(clamp(nx))
      rawY.set(clamp(ny))
    },
    [rawX, rawY],
  )

  useEffect(() => {
    // Try gyroscope first
    const tryGyro = async () => {
      // iOS 13+ requires permission
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

      // Test if we actually get readings
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
        // If no reading after 500ms, fall back to mouse
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
