import { useMotionValue, useSpring, useTransform, type MotionValue } from 'framer-motion'

/**
 * Metabolic Pressure Engine — the organism's temporal pressure
 * modulates every animation constant in the UI.
 *
 * pressure = 0.0 → calm: slow breathing, loose springs, cool tones
 * pressure = 1.0 → urgent: fast breathing, tight springs, warm tones
 *
 * Zero re-renders — all values are MotionValues derived via useTransform.
 * The raw pressure is spring-smoothed so transitions feel organic, not jarring.
 *
 * Consumers never read "pressure: 0.7" — they feel it because
 * their springs tighten, their durations shorten, their colors warm.
 */

// Heavy spring — pressure changes should feel like tidal shifts, not twitches
const PRESSURE_SPRING = { stiffness: 8, damping: 15, mass: 3 }

export interface MetabolicValues {
  /** Smoothed pressure 0–1 (MotionValue, never triggers re-render) */
  pressure: MotionValue<number>

  // ─── Derived Animation Modulators ─────────────────────────────────

  /** Aurora breathing duration multiplier: 1.0 (calm) → 0.4 (urgent) */
  breathScale: MotionValue<number>

  /** Particle drift speed multiplier: 1.0 (calm) → 2.2 (urgent) */
  driftScale: MotionValue<number>

  /** Spring stiffness additive offset: 0 (calm) → +30 (urgent) */
  stiffnessBoost: MotionValue<number>

  /** Spring damping additive offset: 0 (calm) → -4 (urgent, snappier) */
  dampingShift: MotionValue<number>

  /** Color temperature shift: 0 (neutral) → 1 (warm shift) */
  warmth: MotionValue<number>
}

export function useMetabolicPressure(): MetabolicValues {
  const rawPressure = useMotionValue(0)
  const pressure = useSpring(rawPressure, PRESSURE_SPRING)

  // ─── Derived transforms (pure MotionValue math, zero re-renders) ──

  // Breathing slows at 0, quickens at 1
  // 0 → 1.0 (full duration), 1 → 0.4 (40% duration = 2.5x faster)
  const breathScale = useTransform(pressure, (p: number) => 1.0 - p * 0.6)

  // Particles accelerate under pressure
  // 0 → 1.0x speed, 1 → 2.2x speed
  const driftScale = useTransform(pressure, (p: number) => 1.0 + p * 1.2)

  // Springs get stiffer (snappier response) under pressure
  const stiffnessBoost = useTransform(pressure, (p: number) => p * 30)

  // Damping decreases slightly → more responsive, less floaty
  const dampingShift = useTransform(pressure, (p: number) => p * -4)

  // Color temperature warms linearly with pressure
  const warmth = useTransform(pressure, (p: number) => p)

  return {
    pressure,
    breathScale,
    driftScale,
    stiffnessBoost,
    dampingShift,
    warmth,
    /** @internal — exposed for the provider to feed WS data */
    _setRaw: rawPressure.set.bind(rawPressure),
  } as MetabolicValues & { _setRaw: (v: number) => void }
}

/**
 * Feed raw pressure into the metabolic engine.
 * Called from the WebSocket handler — not a React effect.
 */
export type MetabolicSetter = (pressure: number) => void
