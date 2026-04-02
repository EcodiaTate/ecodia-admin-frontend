import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NAV_LINKS, getSceneKey } from './spatialConfig'
import { useSpatialContext } from './SpatialDepthProvider'

const glide = { type: 'spring' as const, stiffness: 70, damping: 18, mass: 1.2 }

export function FloatingNav() {
  const location = useLocation()
  const activeKey = getSceneKey(location.pathname)
  const [visible, setVisible] = useState(true)
  const [hovered, setHovered] = useState(false)
  const { tiltX, tiltY } = useSpatialContext()

  // Nav floats at its own Z-depth — shifts opposite to content for parallax separation
  const navX = useTransform(tiltX, (v) => v * -6)
  // Subtle rotation follows device tilt
  const navRotateY = useTransform(tiltX, (v) => v * 1.5)
  const navRotateX = useTransform(tiltY, (v) => v * -1.2)

  // Desktop: auto-fade after 3s, reappear on left-edge hover
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (e.clientX < 100) setVisible(true)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  useEffect(() => {
    if (hovered) { setVisible(true); return }
    const timer = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(timer)
  }, [hovered, location.pathname])

  useEffect(() => { setVisible(true) }, [location.pathname])

  return (
    <>
      {/* ─── Desktop: floating glass rail on the left ─── */}
      <motion.nav
        className="fixed left-5 top-1/2 z-30 hidden flex-col items-center gap-1 rounded-3xl py-5 px-2 md:flex"
        style={{
          y: '-50%',
          x: navX,
          rotateY: navRotateY,
          rotateX: navRotateX,
          transformPerspective: 800,
          backgroundColor: 'rgba(255, 255, 255, 0.35)',
          boxShadow: '0 24px 60px -16px rgba(0, 104, 122, 0.05)',
        }}
        animate={{ opacity: visible || hovered ? 1 : 0.08 }}
        transition={{ type: 'spring', stiffness: 60, damping: 20 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Wordmark */}
        <motion.span
          className="mb-3 font-display text-[9px] font-medium uppercase tracking-[0.3em] text-on-surface-muted/50"
          animate={{ opacity: visible || hovered ? 0.5 : 0 }}
          transition={{ type: 'spring', stiffness: 70, damping: 18 }}
        >
          EOS
        </motion.span>

        {NAV_LINKS.map((scene, i) => {
          const isActive = getSceneKey(scene.path) === activeKey
          const Icon = scene.icon

          return (
            <NavLink key={scene.path} to={scene.path} className="relative group">
              {/* Active glow */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="nav-active-glow"
                    className="absolute -inset-0.5 rounded-2xl bg-primary/8 shadow-glow-primary"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={glide}
                  />
                )}
              </AnimatePresence>

              {/* Icon with ambient drift */}
              <motion.div
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-xl',
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-muted/40 hover:text-on-surface-variant',
                )}
                animate={{ y: [0, -(1.5 + (i % 3) * 0.5), 0] }}
                transition={{
                  duration: 6 + i * 0.8,
                  repeat: Infinity,
                  ease: [0.42, 0, 0.58, 1],
                  delay: i * 0.5,
                }}
              >
                <Icon className="h-[17px] w-[17px]" strokeWidth={1.75} />
              </motion.div>

              {/* Label — slides out on hover */}
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 0 }}
                whileHover={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', stiffness: 90, damping: 20 }}
                className="pointer-events-none absolute left-full top-1/2 ml-4 -translate-y-1/2 whitespace-nowrap rounded-xl bg-white/60 px-3 py-1.5 text-xs font-medium text-on-surface-variant opacity-0 group-hover:opacity-100"
              >
                {scene.label}
              </motion.span>
            </NavLink>
          )
        })}
      </motion.nav>

      {/* ─── Mobile: bottom glass bar ─── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around px-2 py-2 md:hidden"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.50)',
          boxShadow: '0 -12px 40px -10px rgba(0, 104, 122, 0.04)',
        }}
      >
        {NAV_LINKS.map((scene) => {
          const isActive = getSceneKey(scene.path) === activeKey
          const Icon = scene.icon

          return (
            <NavLink
              key={scene.path}
              to={scene.path}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2',
                isActive ? 'text-primary' : 'text-on-surface-muted/40',
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-mobile-active"
                  className="absolute inset-0 rounded-2xl bg-primary/8"
                  transition={glide}
                />
              )}
              <Icon className="relative h-[18px] w-[18px]" strokeWidth={1.75} />
              <span className="relative text-[9px] font-medium uppercase tracking-wider">{scene.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
