import { motion } from 'framer-motion'
import { useMousePosition } from '@/hooks/useMousePosition'

export function CursorGlow() {
  const { mouseX, mouseY } = useMousePosition()

  return (
    <motion.div
      className="fixed pointer-events-none z-[2]"
      style={{
        x: mouseX,
        y: mouseY,
        width: 350,
        height: 350,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.04), rgba(0, 104, 122, 0.02) 40%, transparent 70%)',
        transform: 'translate(-50%, -50%)',
        filter: 'blur(1px)',
      }}
    />
  )
}
