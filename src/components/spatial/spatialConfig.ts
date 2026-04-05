import {
  Orbit,
  Waypoints,
  Mail,
  Linkedin,
  Users,
  Brain,
  Network,
  Code2,
  Flame,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'

export interface ScenePosition {
  x: number
  y: number
  z: number
}

export interface SceneConfig {
  path: string
  label: string
  icon: LucideIcon
  position: ScenePosition
  aurora: AuroraConfig
}

export interface AuroraOrb {
  color: string
  x: string
  y: string
  size: string
}

export interface AuroraConfig {
  orbs: AuroraOrb[]
}

// ═══════════════════════════════════════════════════════════════════════
// SCENES — Ordered by cognitive flow:
//   Awareness → Intelligence → Channels → Relations → Surfaces → Action → Memory → System
//
// Aurora palette: green + gold — each scene has a distinct atmospheric signature
// ═══════════════════════════════════════════════════════════════════════

export const SCENES: Record<string, SceneConfig> = {
  // ── Awareness: what's happening ──
  // Centered warm gold bloom — sun at the heart of the ecosystem
  dashboard: {
    path: '/dashboard',
    label: 'Vitals',
    icon: Orbit,
    position: { x: 0, y: 0, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(200, 145, 10, 0.09)', x: '50%', y: '55%', size: '80%' },
        { color: 'rgba(46, 204, 113, 0.06)', x: '20%', y: '75%', size: '55%' },
        { color: 'rgba(27, 122, 61, 0.04)', x: '80%', y: '25%', size: '50%' },
      ],
    },
  },

  // ── Intelligence: ask anything ──
  // Deep green canopy — neural depth
  cortex: {
    path: '/cortex',
    label: 'Cortex',
    icon: Brain,
    position: { x: 0, y: -1, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(27, 122, 61, 0.10)', x: '45%', y: '35%', size: '75%' },
        { color: 'rgba(46, 204, 113, 0.07)', x: '70%', y: '60%', size: '55%' },
        { color: 'rgba(200, 145, 10, 0.04)', x: '20%', y: '80%', size: '45%' },
      ],
    },
  },

  // ── Channels: communication streams ──
  // Cool green mist — clarity for reading
  gmail: {
    path: '/gmail',
    label: 'Mail',
    icon: Mail,
    position: { x: -1, y: 0, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(46, 204, 113, 0.06)', x: '25%', y: '30%', size: '60%' },
        { color: 'rgba(27, 122, 61, 0.05)', x: '75%', y: '65%', size: '55%' },
        { color: 'rgba(200, 145, 10, 0.03)', x: '60%', y: '20%', size: '40%' },
      ],
    },
  },
  // Warm gold horizon — influence and reach
  linkedin: {
    path: '/linkedin',
    label: 'Social',
    icon: Linkedin,
    position: { x: 1, y: 0, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(200, 145, 10, 0.08)', x: '65%', y: '40%', size: '70%' },
        { color: 'rgba(245, 200, 66, 0.05)', x: '30%', y: '70%', size: '55%' },
        { color: 'rgba(46, 204, 113, 0.04)', x: '80%', y: '80%', size: '40%' },
      ],
    },
  },

  // ── Relations: people and money ──
  // Verdant spread — growing relationships
  crm: {
    path: '/crm',
    label: 'Pipeline',
    icon: Users,
    position: { x: -1, y: 1, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(46, 204, 113, 0.08)', x: '35%', y: '45%', size: '70%' },
        { color: 'rgba(27, 122, 61, 0.05)', x: '75%', y: '25%', size: '50%' },
        { color: 'rgba(200, 145, 10, 0.04)', x: '20%', y: '80%', size: '50%' },
      ],
    },
  },
  // Warm gold with green undertone — ledger precision (consolidated Finance + Bookkeeping)
  bookkeeping: {
    path: '/bookkeeping',
    label: 'Ledger',
    icon: BookOpen,
    position: { x: 0, y: 1, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(200, 145, 10, 0.10)', x: '55%', y: '35%', size: '75%' },
        { color: 'rgba(245, 200, 66, 0.06)', x: '25%', y: '70%', size: '55%' },
        { color: 'rgba(46, 204, 113, 0.04)', x: '80%', y: '80%', size: '45%' },
      ],
    },
  },

  // ── Intelligence: codebase semantic mind ──
  // Green with gold sparks — knowledge embedded in code
  codebase: {
    path: '/codebase',
    label: 'Code',
    icon: Code2,
    position: { x: 2, y: 0, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(46, 204, 113, 0.07)', x: '45%', y: '35%', size: '65%' },
        { color: 'rgba(200, 145, 10, 0.05)', x: '75%', y: '65%', size: '55%' },
        { color: 'rgba(27, 122, 61, 0.04)', x: '20%', y: '70%', size: '45%' },
      ],
    },
  },

  // ── Memory: world model + archive (consolidated KG + Explorer) ──
  // Deep dual — the oldest layers of the organism
  'knowledge-graph': {
    path: '/knowledge-graph',
    label: 'Memory',
    icon: Network,
    position: { x: -1, y: 2, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(27, 122, 61, 0.08)', x: '40%', y: '40%', size: '70%' },
        { color: 'rgba(200, 145, 10, 0.06)', x: '70%', y: '60%', size: '55%' },
        { color: 'rgba(46, 204, 113, 0.04)', x: '25%', y: '25%', size: '45%' },
      ],
    },
  },

  // ── Momentum: forward motion tracker ──
  // Warm gold + green — energy and growth
  momentum: {
    path: '/momentum',
    label: 'Momentum',
    icon: Flame,
    position: { x: 1, y: -1, z: 0 },
    aurora: {
      orbs: [
        { color: 'rgba(200, 145, 10, 0.09)', x: '40%', y: '40%', size: '75%' },
        { color: 'rgba(46, 204, 113, 0.07)', x: '70%', y: '65%', size: '55%' },
        { color: 'rgba(245, 200, 66, 0.05)', x: '25%', y: '75%', size: '45%' },
      ],
    },
  },

  // ── Infrastructure: system internals (consolidated Settings + Workspace + Factory) ──
  // Subtle, muted — infrastructure hum
  settings: {
    path: '/settings',
    label: 'System',
    icon: Waypoints,
    position: { x: 0, y: 2, z: -1 },
    aurora: {
      orbs: [
        { color: 'rgba(27, 122, 61, 0.05)', x: '50%', y: '50%', size: '80%' },
        { color: 'rgba(200, 145, 10, 0.03)', x: '30%', y: '30%', size: '50%' },
        { color: 'rgba(46, 204, 113, 0.03)', x: '70%', y: '70%', size: '45%' },
      ],
    },
  },
}

/** Extract the scene key from a pathname (e.g. '/crm/abc' → 'crm') */
export function getSceneKey(pathname: string): string {
  const segment = pathname.split('/')[1] || 'dashboard'
  return segment in SCENES ? segment : 'dashboard'
}

/** Get scene config for a pathname */
export function getScene(pathname: string): SceneConfig {
  return SCENES[getSceneKey(pathname)] ?? SCENES.dashboard
}

/**
 * Compute a normalized direction vector between two scenes.
 * Returns { nx, ny, nz } used by the variant functions.
 */
export function getDirection(fromKey: string, toKey: string) {
  const from = SCENES[fromKey] ?? SCENES.dashboard
  const to = SCENES[toKey] ?? SCENES.dashboard

  const dx = to.position.x - from.position.x
  const dy = to.position.y - from.position.y
  const dz = to.position.z - from.position.z

  const magnitude = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

  return {
    nx: dx / magnitude,
    ny: dy / magnitude,
    nz: dz / magnitude,
    distance: magnitude,
  }
}

export interface DirectionVector {
  nx: number
  ny: number
  nz: number
  distance: number
}

/**
 * Framer Motion variant functions.
 *
 * These are evaluated dynamically via the `custom` prop. The `custom` value
 * is a DirectionVector that gets re-read at animation time — critically,
 * the `exit` variant reads the CURRENT direction (not the stale one from
 * mount time). This is what makes 1→2→pause→1 work correctly.
 *
 * The content travels 110vw/vh so it fully leaves the viewport.
 * During the crossfade overlap, blur + partial opacity creates the
 * depth-of-field "same holographic plane" illusion.
 */
export const sceneVariants = {
  initial: (d: DirectionVector) => ({
    opacity: 0.2,
    x: `${d.nx * 110}vw`,
    y: `${d.ny * 110}vh`,
    scale: 1 + d.nz * 0.04,
    rotateY: d.nx * 2,
    rotateX: -d.ny * 1.5,
  }),
  animate: {
    opacity: 1,
    x: '0vw',
    y: '0vh',
    scale: 1,
    rotateY: 0,
    rotateX: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 80,
      damping: 18,
      mass: 1,
      opacity: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
  },
  exit: (d: DirectionVector) => ({
    opacity: 0,
    x: `${-d.nx * 110}vw`,
    y: `${-d.ny * 110}vh`,
    scale: 1 - d.nz * 0.04,
    rotateY: -d.nx * 2,
    rotateX: d.ny * 1.5,
    transition: {
      type: 'spring' as const,
      stiffness: 90,
      damping: 20,
      mass: 0.8,
      opacity: { duration: 0.4, ease: [0.64, 0, 0.78, 0] },
    },
  }),
}

/** Ordered list of nav links */
export const NAV_LINKS = Object.values(SCENES).filter(s => s.path !== '/settings').concat(SCENES.settings)
