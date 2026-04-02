import { useState, useEffect, useCallback } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { NAV_LINKS, getSceneKey } from './spatialConfig'
import * as Tooltip from '@radix-ui/react-tooltip'

export function FloatingNav() {
  const location = useLocation()
  const activeKey = getSceneKey(location.pathname)
  const [visible, setVisible] = useState(true)
  const [hovered, setHovered] = useState(false)

  // Auto-fade after 3s of no mouse near left edge
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (e.clientX < 100) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  // Fade after 3s of not being hovered
  useEffect(() => {
    if (hovered) {
      setVisible(true)
      return
    }
    const timer = setTimeout(() => setVisible(false), 3500)
    return () => clearTimeout(timer)
  }, [hovered, location.pathname])

  // Always show briefly on route change
  useEffect(() => {
    setVisible(true)
  }, [location.pathname])

  return (
    <Tooltip.Provider delayDuration={300}>
      <motion.nav
        className="fixed left-5 top-1/2 z-30 flex flex-col items-center gap-2"
        style={{ y: '-50%' }}
        animate={{ opacity: visible || hovered ? 1 : 0.15 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Wordmark */}
        <motion.span
          className="mb-4 font-display text-label-sm font-medium uppercase tracking-[0.25em] text-on-surface-muted/60"
          animate={{ opacity: visible || hovered ? 0.6 : 0 }}
          transition={{ duration: 0.5 }}
        >
          EOS
        </motion.span>

        {NAV_LINKS.map((scene, i) => {
          const isActive = getSceneKey(scene.path) === activeKey
          const Icon = scene.icon

          return (
            <Tooltip.Root key={scene.path}>
              <Tooltip.Trigger asChild>
                <NavLink to={scene.path} className="relative">
                  {/* Active glow ring */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-glow"
                        className="absolute -inset-1.5 rounded-2xl bg-primary-container/10 shadow-glow-primary"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon container with ambient drift */}
                  <motion.div
                    className={cn(
                      'relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                      isActive
                        ? 'text-primary'
                        : 'text-on-surface-muted/50 hover:text-on-surface-variant',
                    )}
                    animate={{
                      y: [0, -(2 + (i % 3)), 0],
                    }}
                    transition={{
                      duration: 5 + i * 0.7,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: i * 0.4,
                    }}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />

                    {/* Breathing dot for active */}
                    {isActive && (
                      <motion.div
                        className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary-container"
                        animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}
                  </motion.div>
                </NavLink>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content
                  side="right"
                  sideOffset={16}
                  className="glass-elevated rounded-xl px-3 py-1.5 text-xs font-medium text-on-surface-variant"
                >
                  {scene.label}
                  <Tooltip.Arrow className="fill-white/40" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )
        })}
      </motion.nav>
    </Tooltip.Provider>
  )
}
