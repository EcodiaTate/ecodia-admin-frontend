/**
 * HomecomingOverlay — Drift state visual layer
 *
 * When user returns after >30min absence:
 * - Soft veil dims interface (drift state)
 * - Scene whispers appear one by one (mono, minimal)
 * - Aurora warms then cools (via CustomEvent to MetabolicProvider)
 * - Constellation does expansion pulse
 * - Fades away over 10-15s or 3s on interaction
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useHomecoming } from '@/hooks/useHomecoming'

const whisperSpring = { type: 'spring' as const, stiffness: 60, damping: 20, mass: 1.2 }

export function HomecomingOverlay() {
  const { isDrifting, wakeProgress, whispers, activeWhisperIndex } = useHomecoming()

  if (!isDrifting && wakeProgress >= 1) return null

  // Veil opacity: starts at 0.25, fades as wake progresses
  const veilOpacity = Math.max(0, 0.25 * (1 - wakeProgress))

  return (
    <AnimatePresence>
      {(isDrifting || wakeProgress < 1) && (
        <motion.div
          className="fixed inset-0 z-[45] pointer-events-none flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Drift veil — soft warm tint that fades */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 50%, rgba(200, 145, 10, ${veilOpacity * 0.3}), rgba(27, 122, 61, ${veilOpacity * 0.1}) 60%, transparent 85%)`,
            }}
            animate={{ opacity: 1 - wakeProgress }}
            transition={{ type: 'spring', stiffness: 20, damping: 15 }}
          />

          {/* Scene whispers — appear one by one during wake */}
          <div className="relative flex flex-col items-center gap-3 mt-[30vh]">
            <AnimatePresence>
              {whispers.map((whisper, i) => (
                i <= activeWhisperIndex && (
                  <motion.div
                    key={`${whisper.scene}-${i}`}
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{
                      opacity: Math.max(0.15, 1 - wakeProgress * 0.8),
                      y: 0,
                      scale: 1,
                    }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={whisperSpring}
                    className="text-center"
                  >
                    <span className="font-mono text-[11px] tracking-widest uppercase text-on-surface-muted/40">
                      {whisper.text}
                    </span>
                  </motion.div>
                )
              ))}
            </AnimatePresence>

            {/* Subtle "system held this for you" pulse indicator */}
            {whispers.length > 0 && wakeProgress < 0.3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.1, 0.2, 0.1], scale: [1, 1.15, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="mt-4 h-1.5 w-1.5 rounded-full bg-secondary/30"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
